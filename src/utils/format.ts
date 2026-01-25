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
  if (price === undefined || price === null || Number.isNaN(price)) return '-';
  return `¥${price.toLocaleString()}`;
}

/**
 * 文字列を価格（数値）に安全に変換
 * 無効な値の場合はundefinedを返す
 */
export function parsePrice(value: string): number | undefined {
  if (!value || !value.trim()) return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return undefined;
  return parsed;
}

/**
 * 指定日からの経過日数を計算（日本時間基準）
 */
export function getDaysSince(dateString: string): number {
  // 日本時間 (JST = UTC+9) で日付のみを比較
  const JST_OFFSET = 9 * 60; // 分単位

  const date = new Date(dateString);
  const now = new Date();

  // 各日付をJSTの日付のみ（時刻を除く）に変換
  const getJSTDateOnly = (d: Date): number => {
    const utcTime = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
    const jstTime = utcTime + JST_OFFSET * 60 * 1000;
    const jstDate = new Date(jstTime);
    // 時刻を0:00:00にリセット
    jstDate.setHours(0, 0, 0, 0);
    return jstDate.getTime();
  };

  const dateJST = getJSTDateOnly(date);
  const nowJST = getJSTDateOnly(now);

  const diff = nowJST - dateJST;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 配列をカンマ区切りの文字列に変換
 */
export function joinWithComma(items: string[]): string {
  return items.join(', ');
}
