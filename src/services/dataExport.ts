import {
  documentDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import { Book } from '../types';

const EXPORT_FILENAME = 'tsundoku-backup.json';

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
    console.error('Export error:', error);
    throw error;
  }
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

    const fileUri = result.assets[0].uri;
    const jsonString = await readAsStringAsync(fileUri, {
      encoding: EncodingType.UTF8,
    });

    const data: ExportData = JSON.parse(jsonString);

    // バージョンチェック
    if (!data.version || !data.books) {
      throw new Error('Invalid file format');
    }

    // 基本的なバリデーション
    const validBooks = data.books.filter(book => {
      return (
        book.id &&
        book.title &&
        Array.isArray(book.authors) &&
        book.status &&
        book.priority
      );
    });

    return validBooks;
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}
