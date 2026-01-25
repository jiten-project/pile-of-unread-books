import { supabase } from './supabase';
import { Book } from '../types';

// Supabase の books テーブルの型（snake_case）
interface SupabaseBook {
  id: string;
  owner_user_id: string;
  isbn: string | null;
  title: string;
  authors: string[];
  publisher: string | null;
  published_date: string | null;
  description: string | null;
  page_count: number | null;
  thumbnail_url: string | null;
  categories: string[];
  status: string;
  priority: string;
  condition: string;
  purchase_date: string | null;
  purchase_place: string | null;
  purchase_price: number | null;
  purchase_reason: string | null;
  tags: string[];
  notes: string | null;
  start_date: string | null;
  completed_date: string | null;
  current_page: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * ローカルの Book 型を Supabase 用に変換
 */
function bookToSupabase(book: Book, ownerUserId: string): SupabaseBook {
  return {
    id: book.id,
    owner_user_id: ownerUserId,
    isbn: book.isbn ?? null,
    title: book.title,
    authors: book.authors,
    publisher: book.publisher ?? null,
    published_date: book.publishedDate ?? null,
    description: book.description ?? null,
    page_count: book.pageCount ?? null,
    thumbnail_url: book.thumbnailUrl ?? null,
    categories: book.categories ?? [],
    status: book.status,
    priority: book.priority,
    condition: book.condition ?? 'new',
    purchase_date: book.purchaseDate ?? null,
    purchase_place: book.purchasePlace ?? null,
    purchase_price: book.purchasePrice ?? null,
    purchase_reason: book.purchaseReason ?? null,
    tags: book.tags,
    notes: book.notes ?? null,
    start_date: book.startDate ?? null,
    completed_date: book.completedDate ?? null,
    current_page: book.currentPage ?? null,
    created_at: book.createdAt,
    updated_at: book.updatedAt,
  };
}

/**
 * Supabase の データを ローカルの Book 型に変換
 */
function supabaseToBook(data: SupabaseBook): Book {
  return {
    id: data.id,
    isbn: data.isbn ?? undefined,
    title: data.title,
    authors: data.authors,
    publisher: data.publisher ?? undefined,
    publishedDate: data.published_date ?? undefined,
    description: data.description ?? undefined,
    pageCount: data.page_count ?? undefined,
    thumbnailUrl: data.thumbnail_url ?? undefined,
    categories: data.categories,
    status: data.status as Book['status'],
    priority: data.priority as Book['priority'],
    condition: (data.condition as Book['condition']) ?? 'new',
    purchaseDate: data.purchase_date ?? undefined,
    purchasePlace: data.purchase_place ?? undefined,
    purchasePrice: data.purchase_price ?? undefined,
    purchaseReason: data.purchase_reason ?? undefined,
    tags: data.tags,
    notes: data.notes ?? undefined,
    startDate: data.start_date ?? undefined,
    completedDate: data.completed_date ?? undefined,
    currentPage: data.current_page ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    syncStatus: 'synced',
    ownerUserId: data.owner_user_id,
  };
}

/**
 * クラウドから全ての本を取得
 */
export async function fetchAllBooksFromCloud(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch books from cloud:', error);
    throw error;
  }

  return (data as SupabaseBook[]).map(supabaseToBook);
}

/**
 * クラウドに本を作成（upsert）
 */
export async function upsertBookToCloud(book: Book, ownerUserId: string): Promise<void> {
  const supabaseBook = bookToSupabase(book, ownerUserId);

  const { error } = await supabase
    .from('books')
    .upsert(supabaseBook, { onConflict: 'id' });

  if (error) {
    console.error('Failed to upsert book to cloud:', error);
    throw error;
  }
}

/**
 * 複数の本を一括でクラウドにアップロード（upsert）
 */
export async function upsertBooksToCloud(books: Book[], ownerUserId: string): Promise<void> {
  if (books.length === 0) return;

  const supabaseBooks = books.map(book => bookToSupabase(book, ownerUserId));

  const { error } = await supabase
    .from('books')
    .upsert(supabaseBooks, { onConflict: 'id' });

  if (error) {
    console.error('Failed to upsert books to cloud:', error);
    throw error;
  }
}

/**
 * クラウドから本を削除
 */
export async function deleteBookFromCloud(bookId: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (error) {
    console.error('Failed to delete book from cloud:', error);
    throw error;
  }
}

/**
 * クラウドから全ての本を削除（現在のユーザーの本のみ）
 */
export async function deleteAllBooksFromCloud(): Promise<void> {
  const { error } = await supabase
    .from('books')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // RLSにより自分の本のみ削除される

  if (error) {
    console.error('Failed to delete all books from cloud:', error);
    throw error;
  }
}

/**
 * 指定日時以降に更新された本を取得
 */
export async function fetchBooksUpdatedSince(since: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .gte('updated_at', since)
    .order('updated_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch updated books from cloud:', error);
    throw error;
  }

  return (data as SupabaseBook[]).map(supabaseToBook);
}

/**
 * クラウドの本の数を取得
 */
export async function getCloudBookCount(): Promise<number> {
  const { count, error } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Failed to get cloud book count:', error);
    throw error;
  }

  return count ?? 0;
}

/**
 * 特定の本をクラウドから取得
 */
export async function fetchBookFromCloud(bookId: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Failed to fetch book from cloud:', error);
    throw error;
  }

  return supabaseToBook(data as SupabaseBook);
}
