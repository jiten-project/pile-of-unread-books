import {
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import { Book } from '../types';
import { logError } from '../utils/logger';

const EXPORT_FILENAME = 'tsundoku-backup.json';

// セキュリティ: ファイルサイズ上限（50MB）
const MAX_IMPORT_FILE_SIZE = 50 * 1024 * 1024;

// 有効なステータス値
const VALID_STATUSES = ['wishlist', 'unread', 'reading', 'paused', 'completed', 'released'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];
const VALID_CONDITIONS = ['new', 'good', 'fair', 'poor'];
const VALID_SYNC_STATUSES = ['synced', 'pending', 'error', 'local_only', 'pending_delete'];

interface ExportData {
  version: string;
  exportDate: string;
  books: Book[];
}

export async function exportBooks(books: Book[]): Promise<boolean> {
  try {
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      books,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const fileUri = documentDirectory + EXPORT_FILENAME;

    await writeAsStringAsync(fileUri, jsonString, {
      encoding: EncodingType.UTF8,
    });

    const sharingAvailable = await isAvailableAsync();
    if (sharingAvailable) {
      await shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: '積読データをエクスポート',
      });
      return true;
    } else {
      throw new Error('Sharing is not available');
    }
  } catch (error) {
    logError('exportBooks', error);
    throw error;
  }
}

/**
 * 文字列フィールドをサニタイズ（長さ制限）
 */
function sanitizeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.slice(0, maxLength);
}

/**
 * 数値フィールドを検証（範囲チェック）
 */
function validateNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || isNaN(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

/**
 * 日付文字列を検証
 */
function validateDateString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  // ISO 8601形式または YYYY-MM-DD 形式を許可
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value)) {
    return undefined;
  }
  return value;
}

export async function importBooks(): Promise<Book[] | null> {
  try {
    const result = await getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const file = result.assets[0];

    // セキュリティ: ファイルサイズチェック
    if (file.size && file.size > MAX_IMPORT_FILE_SIZE) {
      throw new Error(`File size exceeds limit (${MAX_IMPORT_FILE_SIZE / 1024 / 1024}MB)`);
    }

    const fileUri = file.uri;
    const jsonString = await readAsStringAsync(fileUri, {
      encoding: EncodingType.UTF8,
    });

    // セキュリティ: 文字列長のチェック（JSONパース前）
    if (jsonString.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('File content too large');
    }

    const data: ExportData = JSON.parse(jsonString);

    // バージョンチェック
    if (!data.version || !data.books || !Array.isArray(data.books)) {
      throw new Error('Invalid file format');
    }

    // 基本的なバリデーションとサニタイズ
    const validBooks: Book[] = [];

    for (const book of data.books) {
      // 必須フィールドの検証
      if (!book.id || typeof book.id !== 'string') continue;
      if (!book.title || typeof book.title !== 'string') continue;
      if (!Array.isArray(book.authors)) continue;
      if (!book.status || !VALID_STATUSES.includes(book.status)) continue;
      if (!book.priority || !VALID_PRIORITIES.includes(book.priority)) continue;

      // サニタイズされた本データを構築
      // セキュリティ: ownerUserIdは削除（インポート時に現在のユーザーで上書きされる）
      const sanitizedBook: Book = {
        id: sanitizeString(book.id, 100) || '',
        title: sanitizeString(book.title, 500) || '',
        authors: book.authors
          .filter((a): a is string => typeof a === 'string')
          .map(a => sanitizeString(a, 200) || '')
          .filter(a => a.length > 0),
        status: book.status as Book['status'],
        priority: book.priority as Book['priority'],
        tags: Array.isArray(book.tags)
          ? book.tags
              .filter((t): t is string => typeof t === 'string')
              .map(t => sanitizeString(t, 50) || '')
              .filter(t => t.length > 0)
          : [],
        categories: Array.isArray(book.categories)
          ? book.categories
              .filter((c): c is string => typeof c === 'string')
              .map(c => sanitizeString(c, 100) || '')
              .filter(c => c.length > 0)
          : [],
        createdAt: validateDateString(book.createdAt) || new Date().toISOString(),
        updatedAt: validateDateString(book.updatedAt) || new Date().toISOString(),
        // オプションフィールド
        isbn: sanitizeString(book.isbn, 20),
        publisher: sanitizeString(book.publisher, 200),
        publishedDate: sanitizeString(book.publishedDate, 20),
        description: sanitizeString(book.description, 5000),
        thumbnailUrl: sanitizeString(book.thumbnailUrl, 500),
        pageCount: validateNumber(book.pageCount, 0, 100000),
        purchaseDate: validateDateString(book.purchaseDate),
        purchasePlace: sanitizeString(book.purchasePlace, 200),
        purchasePrice: validateNumber(book.purchasePrice, 0, 10000000),
        purchaseReason: sanitizeString(book.purchaseReason, 1000),
        notes: sanitizeString(book.notes, 10000),
        startDate: validateDateString(book.startDate),
        completedDate: validateDateString(book.completedDate),
        currentPage: validateNumber(book.currentPage, 0, 100000),
        condition: book.condition && VALID_CONDITIONS.includes(book.condition)
          ? book.condition as Book['condition']
          : undefined,
        // セキュリティ: syncStatusは強制的にpendingに設定
        syncStatus: 'pending',
        // セキュリティ: ownerUserIdは削除（後で設定される）
        ownerUserId: undefined,
      };

      // 必須フィールドが有効な場合のみ追加
      if (sanitizedBook.id && sanitizedBook.title && sanitizedBook.authors.length > 0) {
        validBooks.push(sanitizedBook);
      }
    }

    return validBooks;
  } catch (error) {
    logError('importBooks', error);
    throw error;
  }
}
