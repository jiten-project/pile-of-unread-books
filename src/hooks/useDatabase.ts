import { useEffect, useState, useCallback } from 'react';
import { initDatabase, getAllBooks, insertBook, updateBook, deleteBook, updateSyncStatus } from '../services/database';
import { deleteBookWithSync } from '../services/syncService';
import { useBookStore } from '../store';
import { Book } from '../types';
import { useAuth } from '../contexts';

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
    // 同期が有効な場合は pending ステータスで保存
    const bookWithSync: Book = {
      ...book,
      syncStatus: user ? 'pending' : undefined,
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
