import { Book } from '../types';
import {
  getAllBooks,
  getBooksNeedingSync,
  updateSyncStatus,
  insertBook,
  updateBook,
  deleteBook as deleteLocalBook,
} from './database';
import {
  fetchAllBooksFromCloud,
  upsertBooksToCloud,
  deleteBookFromCloud,
} from './cloudDatabase';

export type SyncState = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
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
    conflicts: 0,
    errors: [],
  };

  try {
    // 1. ローカルの全データを取得
    const localBooks = await getAllBooks();
    const localBooksMap = new Map(localBooks.map(b => [b.id, b]));

    // 2. クラウドの全データを取得
    let cloudBooks: Book[] = [];
    try {
      cloudBooks = await fetchAllBooksFromCloud();
    } catch (error) {
      // クラウドからの取得に失敗しても、アップロードは試みる
      result.errors.push(`クラウドからの取得に失敗: ${error}`);
    }
    const cloudBooksMap = new Map(cloudBooks.map(b => [b.id, b]));

    // 3. ローカルにあってクラウドにない、または更新が必要な本を特定
    const booksToUpload: Book[] = [];
    for (const localBook of localBooks) {
      const cloudBook = cloudBooksMap.get(localBook.id);
      if (!cloudBook) {
        // クラウドにない → アップロード
        booksToUpload.push(localBook);
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
        result.errors.push(`アップロードに失敗: ${error}`);
        // 失敗した本のステータスを error に
        for (const book of booksToUpload) {
          await updateSyncStatus(book.id, 'error', userId);
        }
      }
    }

    // 5. クラウドにあってローカルにない、またはクラウドの方が新しい本をダウンロード
    for (const cloudBook of cloudBooks) {
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
          result.errors.push(`ダウンロードに失敗 (${cloudBook.title}): ${error}`);
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
            result.errors.push(`更新に失敗 (${cloudBook.title}): ${error}`);
          }
        }
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.errors.push(`同期に失敗: ${error}`);
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
    conflicts: 0,
    errors: [],
  };

  try {
    // 同期が必要な本を取得
    const booksNeedingSync = await getBooksNeedingSync();

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
      result.errors.push(`アップロードに失敗: ${error}`);

      // 失敗した本のステータスを error に
      for (const book of booksNeedingSync) {
        await updateSyncStatus(book.id, 'error');
      }
    }
  } catch (error) {
    result.errors.push(`同期に失敗: ${error}`);
  }

  return result;
}

/**
 * 本を削除（ローカル + クラウド）
 */
export async function deleteBookWithSync(bookId: string): Promise<void> {
  // ローカルから削除
  await deleteLocalBook(bookId);

  // クラウドからも削除（失敗しても続行）
  try {
    await deleteBookFromCloud(bookId);
  } catch (error) {
    console.warn('Failed to delete book from cloud:', error);
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
