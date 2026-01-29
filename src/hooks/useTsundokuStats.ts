import { useMemo } from 'react';
import { useBookStore } from '../store';
import { useSettings } from '../contexts';
import { Book } from '../types';

interface TsundokuStats {
  // 積読本の数
  tsundokuCount: number;
  // 積読本の購入総額
  tsundokuSpent: number;
  // 平均積読期間（日）
  avgTsundokuDays: number;
  // 最も長く積んでいる本
  oldestTsundoku: Book | undefined;
  // 積読本の一覧
  tsundokuBooks: Book[];
}

/**
 * ユーザー定義に基づく積読統計を計算するカスタムフック
 * 設定画面で選んだプリセット（厳格派/中間派/ゆるふわ派）に基づいて算出
 */
export function useTsundokuStats(): TsundokuStats {
  const { books } = useBookStore();
  const { isTsundoku } = useSettings();

  return useMemo(() => {
    const now = new Date();

    // ユーザー定義に基づく積読本をフィルター
    const tsundokuBooks = books.filter(b => isTsundoku(b.status));

    // 積読本の数
    const tsundokuCount = tsundokuBooks.length;

    // 積読本の購入総額
    const tsundokuSpent = tsundokuBooks.reduce(
      (sum, book) => sum + (book.purchasePrice || 0),
      0
    );

    // 平均積読期間（購入日優先、なければ登録日）
    let avgTsundokuDays = 0;
    if (tsundokuCount > 0) {
      const totalDays = tsundokuBooks.reduce((sum, book) => {
        const baseDate = book.purchaseDate || book.createdAt;
        const days = Math.floor(
          (now.getTime() - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgTsundokuDays = Math.round(totalDays / tsundokuCount);
    }

    // 最も長く積んでいる本（購入日基準、なければ登録日）
    const oldestTsundoku = [...tsundokuBooks].sort((a, b) => {
      const dateA = a.purchaseDate || a.createdAt;
      const dateB = b.purchaseDate || b.createdAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    })[0];

    return {
      tsundokuCount,
      tsundokuSpent,
      avgTsundokuDays,
      oldestTsundoku,
      tsundokuBooks,
    };
  }, [books, isTsundoku]);
}
