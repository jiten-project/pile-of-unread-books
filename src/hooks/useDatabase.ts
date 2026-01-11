import { useEffect, useState } from 'react';
import { initDatabase, getAllBooks, insertBook, updateBook, deleteBook } from '../services/database';
import { useBookStore } from '../store';
import { Book } from '../types';

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

  const addBookWithPersist = async (input: Parameters<typeof store.addBook>[0]) => {
    const book = store.addBook(input);
    await insertBook(book);
    return book;
  };

  const updateBookWithPersist = async (id: string, input: Parameters<typeof store.updateBook>[1]) => {
    store.updateBook(id, input);
    const updatedBook = store.getBookById(id);
    if (updatedBook) {
      await updateBook(updatedBook);
    }
  };

  const deleteBookWithPersist = async (id: string) => {
    store.deleteBook(id);
    await deleteBook(id);
  };

  const updateStatusWithPersist = async (id: string, status: Book['status']) => {
    store.updateStatus(id, status);
    const updatedBook = store.getBookById(id);
    if (updatedBook) {
      await updateBook(updatedBook);
    }
  };

  return {
    addBook: addBookWithPersist,
    updateBook: updateBookWithPersist,
    deleteBook: deleteBookWithPersist,
    updateStatus: updateStatusWithPersist,
  };
}
