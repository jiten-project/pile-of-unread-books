/**
 * 日付文字列を日本語形式でフォーマット
 * ISO形式（2024-01-15T00:00:00.000Z）やYYYY-MM-DD形式に対応
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * 出版日を日本語形式でフォーマット
 * 様々な形式に対応: YYYYMMDD, YYYY-MM-DD, YYYY-MM, YYYY, 2024年1月 など
 */
export function formatPublishedDate(dateString?: string): string {
  if (!dateString) return '-';

  const str = dateString.trim();

  // 既に日本語形式（2024年1月、2024年1月15日 など）
  if (/^\d{4}年/.test(str)) {
    return str;
  }

  // YYYYMMDD形式（20240115）
  if (/^\d{8}$/.test(str)) {
    const year = str.slice(0, 4);
    const month = parseInt(str.slice(4, 6), 10);
    const day = parseInt(str.slice(6, 8), 10);
    return `${year}年${month}月${day}日`;
  }

  // YYYY-MM-DD または YYYY/MM/DD 形式
  const fullMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (fullMatch) {
    const [, year, month, day] = fullMatch;
    return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
  }

  // YYYY-MM または YYYY/MM 形式
  const monthMatch = str.match(/^(\d{4})[-/](\d{1,2})$/);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    return `${year}年${parseInt(month, 10)}月`;
  }

  // YYYY 形式
  if (/^\d{4}$/.test(str)) {
    return `${str}年`;
  }

  // その他はそのまま返す
  return str;
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

/**
 * 日付文字列をタイムスタンプ（ミリ秒）に変換
 * ソートや比較に使用
 */
export function getTimestamp(dateString: string | undefined | null): number {
  if (!dateString) return 0;
  const time = new Date(dateString).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * 2つの日付を比較（ソート用）
 * @returns 負: a < b, 正: a > b, 0: 等しい
 */
export function compareDates(
  a: string | undefined | null,
  b: string | undefined | null,
  order: 'asc' | 'desc' = 'asc'
): number {
  const timeA = getTimestamp(a);
  const timeB = getTimestamp(b);
  const diff = timeA - timeB;
  return order === 'asc' ? diff : -diff;
}
