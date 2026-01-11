/**
 * 日付文字列を日本語形式でフォーマット
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ja-JP');
}

/**
 * 金額を日本円形式でフォーマット
 */
export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return '-';
  return `¥${price.toLocaleString()}`;
}

/**
 * 指定日からの経過日数を計算
 */
export function getDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 配列をカンマ区切りの文字列に変換
 */
export function joinWithComma(items: string[]): string {
  return items.join(', ');
}
