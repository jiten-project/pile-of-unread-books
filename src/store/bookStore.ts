import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { Book, BookStatus, CreateBookInput, UpdateBookInput } from '../types';

// expo-cryptoを使ったUUID生成
function generateUUID(): string {
  return Crypto.randomUUID();
}

interface BookState {
  books: Book[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addBook: (input: CreateBookInput) => Book;
  updateBook: (id: string, input: UpdateBookInput) => void;
  deleteBook: (id: string) => void;
  updateStatus: (id: string, status: BookStatus) => void;
  getBookById: (id: string) => Book | undefined;
  getBookByISBN: (isbn: string) => Book | undefined;
  getBooksByStatus: (status: BookStatus) => Book[];
  setBooks: (books: Book[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  isLoading: false,
  error: null,

  addBook: (input: CreateBookInput) => {
    const now = new Date().toISOString();
    const newBook: Book = {
      id: generateUUID(),
      title: input.title,
      authors: input.authors,
      isbn: input.isbn,
      publisher: input.publisher,
      publishedDate: input.publishedDate,
      description: input.description,
      pageCount: input.pageCount,
      thumbnailUrl: input.thumbnailUrl,
      categories: input.categories,
      status: input.status ?? 'unread',
      priority: input.priority ?? 'medium',
      condition: input.condition ?? 'new',
      purchaseDate: input.purchaseDate,
      purchasePlace: input.purchasePlace,
      purchasePrice: input.purchasePrice,
      purchaseReason: input.purchaseReason,
      tags: input.tags ?? [],
      notes: input.notes,
      startDate: input.startDate,
      completedDate: input.completedDate,
      currentPage: input.currentPage,
      createdAt: now,
      updatedAt: now,
    };

    set(state => ({
      books: [...state.books, newBook],
    }));

    return newBook;
  },

  updateBook: (id: string, input: UpdateBookInput) => {
    set(state => ({
      books: state.books.map(book =>
        book.id === id
          ? {
              ...book,
              ...input,
              updatedAt: new Date().toISOString(),
            }
          : book
      ),
    }));
  },

  deleteBook: (id: string) => {
    set(state => ({
      books: state.books.filter(book => book.id !== id),
    }));
  },

  updateStatus: (id: string, status: BookStatus) => {
    const updates: UpdateBookInput = { status };

    if (status === 'reading' && !get().books.find(b => b.id === id)?.startDate) {
      updates.startDate = new Date().toISOString();
    }

    if (status === 'completed') {
      updates.completedDate = new Date().toISOString();
    }

    get().updateBook(id, updates);
  },

  getBookById: (id: string) => {
    return get().books.find(book => book.id === id);
  },

  getBookByISBN: (isbn: string) => {
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    if (!cleanIsbn) return undefined;
    return get().books.find(book => {
      const bookIsbn = book.isbn?.replace(/[-\s]/g, '');
      return bookIsbn === cleanIsbn;
    });
  },

  getBooksByStatus: (status: BookStatus) => {
    return get().books.filter(book => book.status === status);
  },

  setBooks: (books: Book[]) => {
    set({ books });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
