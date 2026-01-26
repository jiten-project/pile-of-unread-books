import { useEffect, useState, useCallback } from 'react';
import { initDatabase, getAllBooks, insertBook, updateBook, deleteBook, updateSyncStatus } from '../services/database';
import { deleteBookWithSync } from '../services/syncService';
import { useBookStore } from '../store';
import { Book, SyncStatus } from '../types';
import { useAuth } from '../contexts';
import { SUBSCRIPTION } from '../constants';

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const { setBooks, setLoading, setError } = useBookStore();

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        await initDatabase();
        const books = await getAllBooks();
        setBooks(books);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError('データベースの初期化に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [setBooks, setLoading, setError]);

  return { isReady };
}

export function usePersistBook() {
  const store = useBookStore();
  const { user } = useAuth();

  const addBookWithPersist = useCallback(async (input: Parameters<typeof store.addBook>[0]) => {
    const book = store.addBook(input);

    // 同期ステータスの判定
    let syncStatus: SyncStatus | undefined;
    if (user) {
      // 現在の同期対象数をカウント（synced + pending）
      // 現在のユーザーの本、または未所有の本のみをカウント
      const books = store.books;
      const currentSyncCount = books.filter(
        b => (b.syncStatus === 'synced' || b.syncStatus === 'pending') &&
             (!b.ownerUserId || b.ownerUserId === user.id)
      ).length;

      // プレミアム判定（TODO: 将来的にはユーザー情報から取得）
      const isPremium = false;
      const limit = isPremium ? Infinity : SUBSCRIPTION.FREE_CLOUD_SYNC_LIMIT;

      // 上限に達していれば local_only、そうでなければ pending
      syncStatus = currentSyncCount >= limit ? 'local_only' : 'pending';
    }

    const bookWithSync: Book = {
      ...book,
      syncStatus,
      ownerUserId: user?.id,
    };
    await insertBook(bookWithSync);
    return book;
  }, [store, user]);

  const updateBookWithPersist = useCallback(async (id: string, input: Parameters<typeof store.updateBook>[1]) => {
    store.updateBook(id, input);
    const updatedBook = store.getBookById(id);
    if (updatedBook) {
      await updateBook(updatedBook);
      // 同期が有効な場合は pending にマーク
      if (user) {
        await updateSyncStatus(id, 'pending', user.id);
      }
    }
  }, [store, user]);

  const deleteBookWithPersist = useCallback(async (id: string) => {
    store.deleteBook(id);
    // 同期が有効な場合はクラウドからも削除
    if (user) {
      await deleteBookWithSync(id);
    } else {
      await deleteBook(id);
    }
  }, [store, user]);

  const updateStatusWithPersist = useCallback(async (id: string, status: Book['status']) => {
    store.updateStatus(id, status);
    const updatedBook = store.getBookById(id);
    if (updatedBook) {
      await updateBook(updatedBook);
      // 同期が有効な場合は pending にマーク
      if (user) {
        await updateSyncStatus(id, 'pending', user.id);
      }
    }
  }, [store, user]);

  return {
    addBook: addBookWithPersist,
    updateBook: updateBookWithPersist,
    deleteBook: deleteBookWithPersist,
    updateStatus: updateStatusWithPersist,
  };
}
