import { useMemo } from 'react';
import { useBookStore } from '../store';
import { useSettings } from '../contexts';
import { Book } from '../types';

interface TsundokuStats {
  // 積読本の数
  tsundokuCount: number;
  // 積読本の購入総額
  tsundokuSpent: number;
  // 積読本の総ページ数
  tsundokuPages: number;
  // 平均積読期間（日）
  avgTsundokuDays: number;
  // 最も長く積んでいる本
  oldestTsundoku: Book | undefined;
  // 積読本の一覧
  tsundokuBooks: Book[];
}

/**
 * ユーザー定義に基づく積読統計を計算するカスタムフック
 * 設定画面で選んだプリセット（厳格派/穏健派/ゆるふわ派）に基づいて算出
 */
export function useTsundokuStats(): TsundokuStats {
  const { books } = useBookStore();
  const { isTsundoku } = useSettings();

  return useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();
    const msPerDay = 1000 * 60 * 60 * 24;

    // 1パスで全ての統計を計算
    const tsundokuBooks: Book[] = [];
    let tsundokuSpent = 0;
    let tsundokuPages = 0;
    let totalDays = 0;
    let oldestTsundoku: Book | undefined;
    let oldestTime = Infinity;

    for (const book of books) {
      if (!isTsundoku(book.status)) continue;

      tsundokuBooks.push(book);
      tsundokuSpent += book.purchasePrice || 0;
      tsundokuPages += book.pageCount || 0;

      const baseDate = book.purchaseDate || book.createdAt;
      const bookTime = new Date(baseDate).getTime();
      const days = Math.floor((nowTime - bookTime) / msPerDay);
      totalDays += days;

      // 最古の本を追跡（sortの代わりにO(n)で検索）
      if (bookTime < oldestTime) {
        oldestTime = bookTime;
        oldestTsundoku = book;
      }
    }

    const tsundokuCount = tsundokuBooks.length;
    const avgTsundokuDays = tsundokuCount > 0 ? Math.round(totalDays / tsundokuCount) : 0;

    return {
      tsundokuCount,
      tsundokuSpent,
      tsundokuPages,
      avgTsundokuDays,
      oldestTsundoku,
      tsundokuBooks,
    };
  }, [books, isTsundoku]);
}
