import { useBookStore } from '../bookStore';
import { Book, BookStatus } from '../../types/book';

// Helper to create a mock book
function createMockBook(overrides: Partial<Book> = {}): Book {
  const now = new Date().toISOString();
  return {
    id: 'test-id-1',
    isbn: '9784873119038',
    title: 'テスト書籍',
    authors: ['著者A'],
    publisher: '出版社',
    publishedDate: '2024-01-01',
    description: 'テスト説明',
    pageCount: 300,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    categories: ['技術書'],
    status: 'unread',
    priority: 'medium',
    condition: 'new',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('useBookStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useBookStore.setState({ books: [], isLoading: false, error: null });
  });

  describe('setBooks', () => {
    it('should set books', () => {
      const books = [createMockBook({ id: '1' }), createMockBook({ id: '2' })];
      useBookStore.getState().setBooks(books);
      expect(useBookStore.getState().books).toHaveLength(2);
    });

    it('should replace existing books', () => {
      useBookStore.getState().setBooks([createMockBook({ id: '1' })]);
      useBookStore.getState().setBooks([createMockBook({ id: '2' })]);
      expect(useBookStore.getState().books).toHaveLength(1);
      expect(useBookStore.getState().books[0].id).toBe('2');
    });
  });

  describe('getBookById', () => {
    beforeEach(() => {
      const books = [
        createMockBook({ id: 'book-1', title: '本1' }),
        createMockBook({ id: 'book-2', title: '本2' }),
        createMockBook({ id: 'book-3', title: '本3' }),
      ];
      useBookStore.getState().setBooks(books);
    });

    it('should find book by id', () => {
      const book = useBookStore.getState().getBookById('book-2');
      expect(book).toBeDefined();
      expect(book?.title).toBe('本2');
    });

    it('should return undefined for non-existent id', () => {
      const book = useBookStore.getState().getBookById('non-existent');
      expect(book).toBeUndefined();
    });
  });

  describe('getBookByISBN', () => {
    beforeEach(() => {
      const books = [
        createMockBook({ id: '1', isbn: '9784873119038' }),
        createMockBook({ id: '2', isbn: '978-4-297-12635-3' }),
        createMockBook({ id: '3', isbn: undefined }),
      ];
      useBookStore.getState().setBooks(books);
    });

    it('should find book by ISBN', () => {
      const book = useBookStore.getState().getBookByISBN('9784873119038');
      expect(book).toBeDefined();
      expect(book?.id).toBe('1');
    });

    it('should find book by ISBN with hyphens removed', () => {
      const book = useBookStore.getState().getBookByISBN('978-4-873-11903-8');
      expect(book).toBeDefined();
      expect(book?.id).toBe('1');
    });

    it('should match ISBN ignoring hyphens in stored value', () => {
      const book = useBookStore.getState().getBookByISBN('9784297126353');
      expect(book).toBeDefined();
      expect(book?.id).toBe('2');
    });

    it('should return undefined for non-existent ISBN', () => {
      const book = useBookStore.getState().getBookByISBN('1234567890123');
      expect(book).toBeUndefined();
    });

    it('should return undefined for empty ISBN', () => {
      const book = useBookStore.getState().getBookByISBN('');
      expect(book).toBeUndefined();
    });
  });

  describe('getBooksByStatus', () => {
    beforeEach(() => {
      const books = [
        createMockBook({ id: '1', status: 'unread' }),
        createMockBook({ id: '2', status: 'reading' }),
        createMockBook({ id: '3', status: 'unread' }),
        createMockBook({ id: '4', status: 'completed' }),
        createMockBook({ id: '5', status: 'reading' }),
      ];
      useBookStore.getState().setBooks(books);
    });

    it('should filter books by status', () => {
      const unread = useBookStore.getState().getBooksByStatus('unread');
      expect(unread).toHaveLength(2);
    });

    it('should return books with reading status', () => {
      const reading = useBookStore.getState().getBooksByStatus('reading');
      expect(reading).toHaveLength(2);
    });

    it('should return books with completed status', () => {
      const completed = useBookStore.getState().getBooksByStatus('completed');
      expect(completed).toHaveLength(1);
    });

    it('should return empty array for status with no books', () => {
      const wishlist = useBookStore.getState().getBooksByStatus('wishlist');
      expect(wishlist).toHaveLength(0);
    });
  });

  describe('addBook', () => {
    it('should add a new book with generated id', () => {
      const newBook = useBookStore.getState().addBook({
        title: '新しい本',
        authors: ['著者'],
      });

      expect(newBook.id).toBeDefined();
      expect(newBook.title).toBe('新しい本');
      expect(useBookStore.getState().books).toHaveLength(1);
    });

    it('should set default values for optional fields', () => {
      const newBook = useBookStore.getState().addBook({
        title: '新しい本',
        authors: ['著者'],
      });

      expect(newBook.status).toBe('unread');
      expect(newBook.priority).toBe('medium');
      expect(newBook.condition).toBe('new');
      expect(newBook.tags).toEqual([]);
    });

    it('should set createdAt and updatedAt', () => {
      const before = new Date().toISOString();
      const newBook = useBookStore.getState().addBook({
        title: '新しい本',
        authors: ['著者'],
      });
      const after = new Date().toISOString();

      expect(newBook.createdAt >= before).toBe(true);
      expect(newBook.createdAt <= after).toBe(true);
      expect(newBook.updatedAt).toBe(newBook.createdAt);
    });
  });

  describe('updateBook', () => {
    beforeEach(() => {
      useBookStore.getState().setBooks([
        createMockBook({ id: 'book-1', title: '元のタイトル' }),
      ]);
    });

    it('should update book fields', () => {
      useBookStore.getState().updateBook('book-1', { title: '新しいタイトル' });
      const book = useBookStore.getState().getBookById('book-1');
      expect(book?.title).toBe('新しいタイトル');
    });

    it('should update updatedAt timestamp', () => {
      // Set a specific createdAt/updatedAt in the past
      useBookStore.getState().setBooks([
        createMockBook({
          id: 'book-1',
          title: '元のタイトル',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }),
      ]);

      const before = useBookStore.getState().getBookById('book-1')?.updatedAt;

      useBookStore.getState().updateBook('book-1', { title: '更新' });

      const after = useBookStore.getState().getBookById('book-1')?.updatedAt;
      expect(after).not.toBe(before);
    });

    it('should not affect other books', () => {
      useBookStore.getState().setBooks([
        createMockBook({ id: 'book-1', title: '本1' }),
        createMockBook({ id: 'book-2', title: '本2' }),
      ]);

      useBookStore.getState().updateBook('book-1', { title: '更新された本1' });

      expect(useBookStore.getState().getBookById('book-1')?.title).toBe('更新された本1');
      expect(useBookStore.getState().getBookById('book-2')?.title).toBe('本2');
    });
  });

  describe('deleteBook', () => {
    beforeEach(() => {
      useBookStore.getState().setBooks([
        createMockBook({ id: 'book-1' }),
        createMockBook({ id: 'book-2' }),
        createMockBook({ id: 'book-3' }),
      ]);
    });

    it('should delete book by id', () => {
      useBookStore.getState().deleteBook('book-2');
      expect(useBookStore.getState().books).toHaveLength(2);
      expect(useBookStore.getState().getBookById('book-2')).toBeUndefined();
    });

    it('should keep other books', () => {
      useBookStore.getState().deleteBook('book-2');
      expect(useBookStore.getState().getBookById('book-1')).toBeDefined();
      expect(useBookStore.getState().getBookById('book-3')).toBeDefined();
    });

    it('should handle deletion of non-existent book', () => {
      useBookStore.getState().deleteBook('non-existent');
      expect(useBookStore.getState().books).toHaveLength(3);
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      useBookStore.getState().setBooks([
        createMockBook({ id: 'book-1', status: 'unread' }),
      ]);
    });

    it('should update status', () => {
      useBookStore.getState().updateStatus('book-1', 'reading');
      expect(useBookStore.getState().getBookById('book-1')?.status).toBe('reading');
    });

    it('should set startDate when changing to reading', () => {
      useBookStore.getState().updateStatus('book-1', 'reading');
      const book = useBookStore.getState().getBookById('book-1');
      expect(book?.startDate).toBeDefined();
    });

    it('should not overwrite existing startDate', () => {
      const existingStartDate = '2024-01-01T00:00:00.000Z';
      useBookStore.getState().setBooks([
        createMockBook({ id: 'book-1', status: 'paused', startDate: existingStartDate }),
      ]);

      useBookStore.getState().updateStatus('book-1', 'reading');
      expect(useBookStore.getState().getBookById('book-1')?.startDate).toBe(existingStartDate);
    });

    it('should set completedDate when changing to completed', () => {
      useBookStore.getState().updateStatus('book-1', 'completed');
      const book = useBookStore.getState().getBookById('book-1');
      expect(book?.completedDate).toBeDefined();
    });
  });

  describe('setLoading and setError', () => {
    it('should set loading state', () => {
      useBookStore.getState().setLoading(true);
      expect(useBookStore.getState().isLoading).toBe(true);

      useBookStore.getState().setLoading(false);
      expect(useBookStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      useBookStore.getState().setError('Something went wrong');
      expect(useBookStore.getState().error).toBe('Something went wrong');

      useBookStore.getState().setError(null);
      expect(useBookStore.getState().error).toBeNull();
    });
  });
});
