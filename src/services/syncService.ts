import { Book } from '../types';
import {
  getAllBooks,
  getBooksNeedingSync,
  getBooksPendingDelete,
  updateSyncStatus,
  insertBook,
  updateBook,
  deleteBook as deleteLocalBook,
  markBookAsDeleted,
  hardDeleteBook,
} from './database';
import {
  fetchAllBooksFromCloud,
  upsertBooksToCloud,
  deleteBookFromCloud,
} from './cloudDatabase';
import { SUBSCRIPTION } from '../constants';

export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * 同期対象の本を選定（上限考慮）
 * 登録日が古い順に上限まで選定
 * local_only の本も含めることで、容量が空いた時に再同期対象に戻れるようにする
 * @returns 同期可能な本のIDセット
 */
function getSyncEligibleBookIds(books: Book[], isPremium: boolean = false): Set<string> {
  const limit = isPremium ? Infinity : SUBSCRIPTION.FREE_CLOUD_SYNC_LIMIT;

  // pending_delete のみ除外し、登録日順にソート
  // local_only も含めることで、容量が空いた時に再同期対象になれる
  const eligibleBooks = books
    .filter(b => b.syncStatus !== 'pending_delete')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // 上限までのIDをセットに追加
  const eligibleIds = new Set<string>();
  for (let i = 0; i < Math.min(eligibleBooks.length, limit); i++) {
    eligibleIds.add(eligibleBooks[i].id);
  }

  return eligibleIds;
}

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  deleted: number;  // リモートで削除された本のローカル削除数
  conflicts: number;
  errors: string[];
}

/**
 * Last-Write-Wins で競合解決
 * updatedAt が新しい方を採用
 */
function resolveConflict(local: Book, remote: Book): 'local' | 'remote' {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();
  return localTime >= remoteTime ? 'local' : 'remote';
}

/**
 * フル同期を実行
 * 1. ローカルの未同期データをクラウドにアップロード
 * 2. クラウドのデータをダウンロードしてマージ
 */
export async function performFullSync(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    uploaded: 0,
    downloaded: 0,
    deleted: 0,
    conflicts: 0,
    errors: [],
  };

  try {
    // 0. 削除待ちの本をクラウドから削除（オフライン時に削除された本の再試行）
    const booksPendingDelete = await getBooksPendingDelete();
    const pendingDeleteIds = new Set(booksPendingDelete.map(b => b.id));

    for (const book of booksPendingDelete) {
      // 現在のユーザーの本のみ削除
      if (book.ownerUserId && book.ownerUserId !== userId) {
        continue;
      }
      try {
        await deleteBookFromCloud(book.id);
        await hardDeleteBook(book.id);
      } catch (error) {
        // 削除失敗は継続（次回の同期で再試行）
        result.errors.push(`クラウドからの削除に失敗 (${book.title}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 1. ローカルの全データを取得（削除待ちを除く）
    const allLocalBooks = await getAllBooks();

    // セキュリティ: 現在のユーザーが所有する本、または未所有の本のみをアップロード対象とする
    // これにより、別のユーザーのデータが誤ってアップロードされることを防ぐ
    // また、削除待ちの本はアップロードしない
    const localBooks = allLocalBooks.filter(book =>
      (!book.ownerUserId || book.ownerUserId === userId) &&
      book.syncStatus !== 'pending_delete'
    );
    const localBooksMap = new Map(localBooks.map(b => [b.id, b]));

    // クラウド同期上限チェック（プレミアムは無制限）
    const isPremium = false; // TODO: 将来的にはユーザー情報から取得
    const syncEligibleIds = getSyncEligibleBookIds(localBooks, isPremium);

    // 同期ステータスを更新
    // - 上限超過の本を local_only としてマーク
    // - 上限内に戻った local_only の本を pending に昇格
    for (const book of localBooks) {
      if (syncEligibleIds.has(book.id)) {
        // 上限内: local_only だった本は pending に昇格して同期対象に戻す
        if (book.syncStatus === 'local_only') {
          await updateSyncStatus(book.id, 'pending', userId);
        }
      } else {
        // 上限超過: local_only でなければ local_only にマーク
        if (book.syncStatus !== 'local_only') {
          await updateSyncStatus(book.id, 'local_only', userId);
        }
      }
    }

    // 2. クラウドの全データを取得
    let cloudBooks: Book[] = [];
    let cloudFetchSuccess = false;
    try {
      cloudBooks = await fetchAllBooksFromCloud();
      cloudFetchSuccess = true;
    } catch (error) {
      // クラウドからの取得に失敗しても、アップロードは試みる
      // ただし、リモート削除の検出は行わない（データ消失を防ぐため）
      result.errors.push(`クラウドからの取得に失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
    const cloudBooksMap = new Map(cloudBooks.map(b => [b.id, b]));

    // 3. ローカルにあってクラウドにない、または更新が必要な本を特定
    const booksToUpload: Book[] = [];
    for (const localBook of localBooks) {
      // 同期対象外（上限超過）の本はスキップ
      if (!syncEligibleIds.has(localBook.id)) {
        continue;
      }

      const cloudBook = cloudBooksMap.get(localBook.id);
      if (!cloudBook) {
        // クラウドにない
        // 重要: クラウド取得が成功した場合のみ「別デバイスで削除された」と判定
        // クラウド取得が失敗した場合は、削除せずアップロード対象とする（データ保護）
        if (cloudFetchSuccess && localBook.syncStatus === 'synced' && localBook.ownerUserId === userId) {
          // 別デバイスで削除された本 → ローカルからも削除
          try {
            await hardDeleteBook(localBook.id);
            result.deleted++;
          } catch (error) {
            result.errors.push(`ローカル削除に失敗 (${localBook.title}): ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          // 新規追加の本、またはクラウド取得失敗時 → アップロード
          booksToUpload.push(localBook);
        }
      } else {
        // 両方にある → 競合解決
        const winner = resolveConflict(localBook, cloudBook);
        if (winner === 'local') {
          booksToUpload.push(localBook);
          result.conflicts++;
        }
      }
    }

    // 4. クラウドにアップロード
    if (booksToUpload.length > 0) {
      try {
        await upsertBooksToCloud(booksToUpload, userId);
        result.uploaded = booksToUpload.length;

        // アップロード成功した本の同期ステータスを更新
        for (const book of booksToUpload) {
          await updateSyncStatus(book.id, 'synced', userId);
        }
      } catch (error) {
        result.errors.push(`アップロードに失敗: ${error instanceof Error ? error.message : String(error)}`);
        // 失敗した本のステータスを error に
        for (const book of booksToUpload) {
          await updateSyncStatus(book.id, 'error', userId);
        }
      }
    }

    // 5. クラウドにあってローカルにない、またはクラウドの方が新しい本をダウンロード
    for (const cloudBook of cloudBooks) {
      // 削除待ちの本はダウンロードしない（次回同期で削除される）
      if (pendingDeleteIds.has(cloudBook.id)) {
        continue;
      }

      const localBook = localBooksMap.get(cloudBook.id);
      if (!localBook) {
        // ローカルにない → ダウンロード
        try {
          const bookWithSync: Book = {
            ...cloudBook,
            syncStatus: 'synced',
            ownerUserId: userId,
          };
          await insertBook(bookWithSync);
          result.downloaded++;
        } catch (error) {
          result.errors.push(`ダウンロードに失敗 (${cloudBook.title}): ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        // 両方にある → 競合解決
        const winner = resolveConflict(localBook, cloudBook);
        if (winner === 'remote') {
          try {
            const bookWithSync: Book = {
              ...cloudBook,
              syncStatus: 'synced',
              ownerUserId: userId,
            };
            await updateBook(bookWithSync);
            result.downloaded++;
            result.conflicts++;
          } catch (error) {
            result.errors.push(`更新に失敗 (${cloudBook.title}): ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.errors.push(`同期に失敗: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * 差分同期を実行（未同期の本のみアップロード）
 */
export async function performIncrementalSync(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    uploaded: 0,
    downloaded: 0,
    deleted: 0,
    conflicts: 0,
    errors: [],
  };

  try {
    // 0. 削除待ちの本をクラウドから削除（オフライン時に削除された本の再試行）
    const booksPendingDelete = await getBooksPendingDelete();
    for (const book of booksPendingDelete) {
      if (book.ownerUserId && book.ownerUserId !== userId) {
        continue;
      }
      try {
        await deleteBookFromCloud(book.id);
        await hardDeleteBook(book.id);
      } catch (error) {
        result.errors.push(`クラウドからの削除に失敗 (${book.title}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 全ての本を取得して同期対象を判定
    const allLocalBooks = await getAllBooks();
    const localBooks = allLocalBooks.filter(book =>
      (!book.ownerUserId || book.ownerUserId === userId) &&
      book.syncStatus !== 'pending_delete'
    );

    // クラウド同期上限チェック（プレミアムは無制限）
    const isPremium = false; // TODO: 将来的にはユーザー情報から取得
    const syncEligibleIds = getSyncEligibleBookIds(localBooks, isPremium);

    // 同期が必要な本を取得
    const allBooksNeedingSync = await getBooksNeedingSync();

    // セキュリティ: 現在のユーザーが所有する本、または未所有の本のみをアップロード
    // さらに、同期対象（上限内）の本のみをフィルタ
    const booksNeedingSync = allBooksNeedingSync.filter(book =>
      (!book.ownerUserId || book.ownerUserId === userId) &&
      syncEligibleIds.has(book.id)
    );

    // 同期ステータスを更新
    // - 上限超過の本を local_only としてマーク
    // - 上限内に戻った local_only の本を pending に昇格
    for (const book of localBooks) {
      if (syncEligibleIds.has(book.id)) {
        // 上限内: local_only だった本は pending に昇格して同期対象に戻す
        if (book.syncStatus === 'local_only') {
          await updateSyncStatus(book.id, 'pending', userId);
        }
      } else {
        // 上限超過: local_only でなければ local_only にマーク
        if (book.syncStatus !== 'local_only') {
          await updateSyncStatus(book.id, 'local_only', userId);
        }
      }
    }

    if (booksNeedingSync.length === 0) {
      result.success = true;
      return result;
    }

    // クラウドにアップロード
    try {
      await upsertBooksToCloud(booksNeedingSync, userId);
      result.uploaded = booksNeedingSync.length;

      // 同期ステータスを更新
      for (const book of booksNeedingSync) {
        await updateSyncStatus(book.id, 'synced', userId);
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`アップロードに失敗: ${error instanceof Error ? error.message : String(error)}`);

      // 失敗した本のステータスを error に
      for (const book of booksNeedingSync) {
        await updateSyncStatus(book.id, 'error', userId);
      }
    }
  } catch (error) {
    result.errors.push(`同期に失敗: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * 本を削除（ローカル + クラウド）
 */
export async function deleteBookWithSync(bookId: string): Promise<void> {
  // まずソフトデリート（pending_delete としてマーク）
  // これにより、クラウド削除が失敗しても次回同期で再試行できる
  await markBookAsDeleted(bookId);

  // クラウドからも削除を試みる
  try {
    await deleteBookFromCloud(bookId);
  } catch (error) {
    // クラウド削除失敗 → pending_delete のまま保持
    // 次回の同期で再試行される
    console.warn('Failed to delete book from cloud, will retry on next sync:', error);
    return;
  }

  // クラウド削除成功したら、ローカルからも完全削除
  try {
    await hardDeleteBook(bookId);
  } catch (error) {
    // ローカル削除失敗は致命的ではない（クラウドは既に削除済み）
    // 次回同期でも再試行されるが、クラウドにないので問題なし
    console.warn('Failed to hard delete book locally:', error);
  }
}

/**
 * 初回同期（ログイン直後に実行）
 * 既存のローカルデータをクラウドにマージ
 */
export async function performInitialSync(userId: string): Promise<SyncResult> {
  // フル同期を実行
  return performFullSync(userId);
}
