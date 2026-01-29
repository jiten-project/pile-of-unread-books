import { MATURITY_LEVELS, MaturityLevel } from '../constants/maturityRanks';

/**
 * 積読日数から熟成度を取得
 * @param days 積読日数
 * @returns 該当するMaturityLevel
 */
export function getMaturityLevel(days: number): MaturityLevel {
  for (const level of MATURITY_LEVELS) {
    if (level.maxDays === null) {
      // 最高レベル（上限なし）
      if (days >= level.minDays) {
        return level;
      }
    } else if (days >= level.minDays && days <= level.maxDays) {
      return level;
    }
  }
  // フォールバック（通常は到達しない）
  return MATURITY_LEVELS[0];
}

/**
 * 購入日または登録日から積読日数を計算
 * @param purchaseDate 購入日
 * @param createdAt 登録日
 * @returns 積読日数
 */
export function calculateTsundokuDays(
  purchaseDate: string | null | undefined,
  createdAt: string
): number {
  const baseDate = purchaseDate || createdAt;
  const now = new Date();
  const bookTime = new Date(baseDate).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((now.getTime() - bookTime) / msPerDay);
}
