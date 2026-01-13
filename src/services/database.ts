import * as SQLite from 'expo-sqlite';
import { Book } from '../types';

const DB_NAME = 'tsundoku.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      isbn TEXT,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      publisher TEXT,
      published_date TEXT,
      description TEXT,
      page_count INTEGER,
      thumbnail_url TEXT,
      categories TEXT,
      status TEXT NOT NULL DEFAULT 'unread',
      priority TEXT NOT NULL DEFAULT 'medium',
      condition TEXT NOT NULL DEFAULT 'new',
      purchase_date TEXT,
      purchase_place TEXT,
      purchase_price REAL,
      purchase_reason TEXT,
      tags TEXT,
      notes TEXT,
      start_date TEXT,
      completed_date TEXT,
      current_page INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 既存テーブルにconditionカラムがない場合は追加
  try {
    await db.execAsync(`ALTER TABLE books ADD COLUMN condition TEXT NOT NULL DEFAULT 'new';`);
  } catch {
    // カラムが既に存在する場合は無視
  }
}

export async function getAllBooks(): Promise<Book[]> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM books ORDER BY created_at DESC');
  return rows.map(rowToBook);
}

/**
 * 本を挿入または更新する（UPSERT）
 * インポート時など、同じIDの本が存在する場合は更新する
 */
export async function insertBook(book: Book): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const params = [
    book.id,
    book.isbn ?? null,
    book.title,
    JSON.stringify(book.authors),
    book.publisher ?? null,
    book.publishedDate ?? null,
    book.description ?? null,
    book.pageCount ?? null,
    book.thumbnailUrl ?? null,
    JSON.stringify(book.categories ?? []),
    book.status,
    book.priority,
    book.condition ?? 'new',
    book.purchaseDate ?? null,
    book.purchasePlace ?? null,
    book.purchasePrice ?? null,
    book.purchaseReason ?? null,
    JSON.stringify(book.tags),
    book.notes ?? null,
    book.startDate ?? null,
    book.completedDate ?? null,
    book.currentPage ?? null,
    book.createdAt,
    book.updatedAt,
  ];

  await db.runAsync(
    `INSERT INTO books (
      id, isbn, title, authors, publisher, published_date, description,
      page_count, thumbnail_url, categories, status, priority, condition,
      purchase_date, purchase_place, purchase_price, purchase_reason,
      tags, notes, start_date, completed_date, current_page,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      isbn = excluded.isbn,
      title = excluded.title,
      authors = excluded.authors,
      publisher = excluded.publisher,
      published_date = excluded.published_date,
      description = excluded.description,
      page_count = excluded.page_count,
      thumbnail_url = excluded.thumbnail_url,
      categories = excluded.categories,
      status = excluded.status,
      priority = excluded.priority,
      condition = excluded.condition,
      purchase_date = excluded.purchase_date,
      purchase_place = excluded.purchase_place,
      purchase_price = excluded.purchase_price,
      purchase_reason = excluded.purchase_reason,
      tags = excluded.tags,
      notes = excluded.notes,
      start_date = excluded.start_date,
      completed_date = excluded.completed_date,
      current_page = excluded.current_page,
      updated_at = excluded.updated_at`,
    params
  );
}

export async function updateBook(book: Book): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db.runAsync(
    `UPDATE books SET
      isbn = ?, title = ?, authors = ?, publisher = ?, published_date = ?,
      description = ?, page_count = ?, thumbnail_url = ?, categories = ?,
      status = ?, priority = ?, condition = ?, purchase_date = ?, purchase_place = ?,
      purchase_price = ?, purchase_reason = ?, tags = ?, notes = ?,
      start_date = ?, completed_date = ?, current_page = ?, updated_at = ?
    WHERE id = ?`,
    [
      book.isbn ?? null,
      book.title,
      JSON.stringify(book.authors),
      book.publisher ?? null,
      book.publishedDate ?? null,
      book.description ?? null,
      book.pageCount ?? null,
      book.thumbnailUrl ?? null,
      JSON.stringify(book.categories ?? []),
      book.status,
      book.priority,
      book.condition ?? 'new',
      book.purchaseDate ?? null,
      book.purchasePlace ?? null,
      book.purchasePrice ?? null,
      book.purchaseReason ?? null,
      JSON.stringify(book.tags),
      book.notes ?? null,
      book.startDate ?? null,
      book.completedDate ?? null,
      book.currentPage ?? null,
      book.updatedAt,
      book.id,
    ]
  );
}

export async function deleteBook(id: string): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
}

export async function deleteAllBooks(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db.runAsync('DELETE FROM books');
}

function rowToBook(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    isbn: row.isbn as string | undefined,
    title: row.title as string,
    authors: JSON.parse(row.authors as string) as string[],
    publisher: row.publisher as string | undefined,
    publishedDate: row.published_date as string | undefined,
    description: row.description as string | undefined,
    pageCount: row.page_count as number | undefined,
    thumbnailUrl: row.thumbnail_url as string | undefined,
    categories: JSON.parse((row.categories as string) || '[]') as string[],
    status: row.status as Book['status'],
    priority: row.priority as Book['priority'],
    condition: (row.condition as Book['condition']) || 'new',
    purchaseDate: row.purchase_date as string | undefined,
    purchasePlace: row.purchase_place as string | undefined,
    purchasePrice: row.purchase_price as number | undefined,
    purchaseReason: row.purchase_reason as string | undefined,
    tags: JSON.parse((row.tags as string) || '[]') as string[],
    notes: row.notes as string | undefined,
    startDate: row.start_date as string | undefined,
    completedDate: row.completed_date as string | undefined,
    currentPage: row.current_page as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
