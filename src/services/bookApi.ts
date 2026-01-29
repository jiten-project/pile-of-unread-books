import { BookInfo } from '../types';
import { logError, logWarn } from '../utils/logger';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPENBD_API = 'https://api.openbd.jp/v1/get';

// API設定
const API_TIMEOUT_MS = 10000; // 10秒

/**
 * ISBNの形式を検証
 * ISBN-10: 10桁（最後の桁は数字または'X'）
 * ISBN-13: 13桁（すべて数字）
 */
export function isValidISBN(isbn: string): boolean {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');

  // ISBN-10の検証
  if (cleanIsbn.length === 10) {
    // 最初の9桁は数字、最後は数字またはX
    if (!/^\d{9}[\dXx]$/.test(cleanIsbn)) {
      return false;
    }
    // チェックディジット検証
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanIsbn[i], 10) * (10 - i);
    }
    const lastChar = cleanIsbn[9].toUpperCase();
    const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
    sum += checkDigit;
    return sum % 11 === 0;
  }

  // ISBN-13の検証
  if (cleanIsbn.length === 13) {
    // すべて数字
    if (!/^\d{13}$/.test(cleanIsbn)) {
      return false;
    }
    // チェックディジット検証
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanIsbn[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleanIsbn[12], 10);
  }

  return false;
}

/**
 * ISBNをクリーンアップ（ハイフン、スペースを除去）
 * 無効なISBNの場合はnullを返す
 */
export function cleanAndValidateISBN(isbn: string): string | null {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');

  // 基本的な文字チェック（数字とXのみ許可）
  if (!/^[\d]+[Xx]?$/.test(cleanIsbn)) {
    return null;
  }

  // 長さチェック
  if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
    return null;
  }

  return cleanIsbn;
}

// エラー種別
export type ApiErrorType = 'network' | 'timeout' | 'server' | 'parse' | 'not_found';

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * タイムアウト付きfetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('timeout', `Request timed out after ${timeoutMs}ms`);
    }
    throw new ApiError('network', 'Network request failed', error);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * レスポンスの検証とJSONパース
 */
async function parseJsonResponse<T>(response: Response, apiName: string): Promise<T> {
  if (!response.ok) {
    throw new ApiError(
      'server',
      `${apiName} returned status ${response.status}: ${response.statusText}`
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError('parse', `Failed to parse ${apiName} response`, error);
  }
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: Array<{
    volumeInfo: {
      title: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      description?: string;
      pageCount?: number;
      categories?: string[];
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      industryIdentifiers?: Array<{
        type: string;
        identifier: string;
      }>;
    };
    saleInfo?: {
      listPrice?: {
        amount?: number;
        currencyCode?: string;
      };
      retailPrice?: {
        amount?: number;
        currencyCode?: string;
      };
    };
  }>;
}

interface OpenBDResponse {
  summary?: {
    isbn?: string;
    title?: string;
    author?: string;
    publisher?: string;
    pubdate?: string;
    cover?: string;
  };
  onix?: {
    DescriptiveDetail?: {
      Extent?: Array<{
        ExtentType?: string;
        ExtentValue?: string;
      }>;
    };
    CollateralDetail?: {
      TextContent?: Array<{
        Text?: string;
      }>;
    };
    ProductSupply?: {
      SupplyDetail?: {
        Price?: Array<{
          PriceAmount?: string;
          CurrencyCode?: string;
        }>;
      };
    };
  };
}

/**
 * 型ガード: GoogleBooksResponseのitemsが有効かチェック
 */
function hasValidItems(
  data: GoogleBooksResponse
): data is GoogleBooksResponse & { items: NonNullable<GoogleBooksResponse['items']> } {
  return Array.isArray(data.items) && data.items.length > 0;
}

/**
 * 型ガード: OpenBDResponseのsummaryが有効かチェック
 */
function hasValidSummary(
  data: OpenBDResponse | null
): data is OpenBDResponse & { summary: NonNullable<OpenBDResponse['summary']> } {
  return data !== null && data.summary !== undefined && data.summary !== null;
}

export async function searchByISBN(isbn: string): Promise<BookInfo | null> {
  const cleanIsbn = cleanAndValidateISBN(isbn);

  // ISBNの形式が無効な場合はnullを返す
  if (!cleanIsbn) {
    logWarn('searchByISBN', 'Invalid ISBN format');
    return null;
  }

  // 両方のAPIを並行して呼び出し、情報を統合する
  const [openBdResult, googleResult] = await Promise.all([
    searchOpenBD(cleanIsbn),
    searchGoogleBooks(cleanIsbn),
  ]);

  // OpenBDの結果を優先（日本の書籍情報が正確）
  if (openBdResult) {
    // OpenBDに画像がなく、Googleにある場合は補完
    if (!openBdResult.thumbnailUrl && googleResult?.thumbnailUrl) {
      openBdResult.thumbnailUrl = googleResult.thumbnailUrl;
    }
    // 説明がなければGoogleから補完
    if (!openBdResult.description && googleResult?.description) {
      openBdResult.description = googleResult.description;
    }
    // ページ数がなければGoogleから補完
    if (!openBdResult.pageCount && googleResult?.pageCount) {
      openBdResult.pageCount = googleResult.pageCount;
    }
    // 価格がなければGoogleから補完
    if (!openBdResult.listPrice && googleResult?.listPrice) {
      openBdResult.listPrice = googleResult.listPrice;
    }
    return openBdResult;
  }

  // OpenBDで見つからなければGoogle Books APIの結果を使用
  if (googleResult) {
    return googleResult;
  }

  return null;
}

async function searchOpenBD(isbn: string): Promise<BookInfo | null> {
  try {
    const response = await fetchWithTimeout(`${OPENBD_API}?isbn=${isbn}`);
    const data = await parseJsonResponse<(OpenBDResponse | null)[]>(response, 'OpenBD');

    if (!Array.isArray(data) || data.length === 0 || !hasValidSummary(data[0])) {
      return null;
    }

    const book = data[0];
    const summary = book.summary;

    // ページ数を取得（複数のExtentTypeを確認）
    let pageCount: number | undefined;
    const extents = book.onix?.DescriptiveDetail?.Extent;
    if (extents) {
      // 00: Main content page count, 07: Print counterpart pages, 11: Content page count
      const pageExtent = extents.find(e => e.ExtentType === '00')
        || extents.find(e => e.ExtentType === '11')
        || extents.find(e => e.ExtentType === '07');
      if (pageExtent?.ExtentValue) {
        const parsed = parseInt(pageExtent.ExtentValue, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 10000) {
          pageCount = parsed;
        }
      }
    }

    // 説明を取得
    let description: string | undefined;
    const textContents = book.onix?.CollateralDetail?.TextContent;
    if (textContents && textContents.length > 0) {
      description = textContents[0].Text;
    }

    // 価格を取得
    let listPrice: number | undefined;
    const prices = book.onix?.ProductSupply?.SupplyDetail?.Price;
    if (prices && prices.length > 0) {
      const priceStr = prices[0].PriceAmount;
      if (priceStr) {
        const parsed = parseInt(priceStr, 10);
        if (!isNaN(parsed)) {
          listPrice = parsed;
        }
      }
    }

    return {
      isbn: summary.isbn,
      title: summary.title || '',
      authors: summary.author ? summary.author.split(/[,、／]/).map(a => a.trim()) : [],
      publisher: summary.publisher,
      publishedDate: summary.pubdate,
      thumbnailUrl: summary.cover,
      pageCount,
      description,
      listPrice,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      logError('OpenBD', error);
    } else {
      logError('OpenBD', error);
    }
    return null;
  }
}

async function searchGoogleBooks(isbn: string): Promise<BookInfo | null> {
  try {
    const response = await fetchWithTimeout(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}`);
    const data = await parseJsonResponse<GoogleBooksResponse>(response, 'Google Books');

    if (!hasValidItems(data)) {
      return null;
    }

    const item = data.items[0];
    const book = item.volumeInfo;

    // ISBNを取得
    let bookIsbn = isbn;
    if (book.industryIdentifiers) {
      const isbn13 = book.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = book.industryIdentifiers.find(id => id.type === 'ISBN_10');
      bookIsbn = isbn13?.identifier || isbn10?.identifier || isbn;
    }

    // 価格を取得（JPYのみ対応）
    let listPrice: number | undefined;
    const saleInfo = item.saleInfo;
    if (saleInfo?.listPrice?.currencyCode === 'JPY') {
      listPrice = saleInfo.listPrice.amount;
    } else if (saleInfo?.retailPrice?.currencyCode === 'JPY') {
      listPrice = saleInfo.retailPrice.amount;
    }

    return {
      isbn: bookIsbn,
      title: book.title,
      authors: book.authors || [],
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      description: book.description,
      pageCount: book.pageCount,
      categories: book.categories,
      thumbnailUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:'),
      listPrice,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      logError('GoogleBooks', error);
    } else {
      logError('GoogleBooks', error);
    }
    return null;
  }
}

export interface SearchParams {
  title?: string;
  author?: string;
  publisher?: string;
}

// 検索クエリの最大長（セキュリティ対策）
const MAX_SEARCH_QUERY_LENGTH = 100;

/**
 * 検索クエリをサニタイズ
 * 長さ制限と不正な文字の除去
 */
function sanitizeSearchQuery(query: string): string {
  const trimmed = query.trim();
  if (trimmed.length > MAX_SEARCH_QUERY_LENGTH) {
    return trimmed.slice(0, MAX_SEARCH_QUERY_LENGTH);
  }
  return trimmed;
}

export async function searchBooks(params: SearchParams): Promise<BookInfo[]> {
  const { title, author, publisher } = params;

  // クエリを構築（サニタイズ適用）
  const queryParts: string[] = [];
  if (title?.trim()) {
    const sanitized = sanitizeSearchQuery(title);
    if (sanitized) {
      queryParts.push(`intitle:${encodeURIComponent(sanitized)}`);
    }
  }
  if (author?.trim()) {
    const sanitized = sanitizeSearchQuery(author);
    if (sanitized) {
      queryParts.push(`inauthor:${encodeURIComponent(sanitized)}`);
    }
  }
  if (publisher?.trim()) {
    const sanitized = sanitizeSearchQuery(publisher);
    if (sanitized) {
      queryParts.push(`inpublisher:${encodeURIComponent(sanitized)}`);
    }
  }

  if (queryParts.length === 0) {
    return [];
  }

  try {
    const response = await fetchWithTimeout(
      `${GOOGLE_BOOKS_API}?q=${queryParts.join('+')}&maxResults=20&printType=books`
    );
    const data = await parseJsonResponse<GoogleBooksResponse>(response, 'Google Books');

    if (!hasValidItems(data)) {
      return [];
    }

    return data.items.map(item => {
      const book = item.volumeInfo;
      let isbn: string | undefined;

      if (book.industryIdentifiers) {
        const isbn13 = book.industryIdentifiers.find(id => id.type === 'ISBN_13');
        const isbn10 = book.industryIdentifiers.find(id => id.type === 'ISBN_10');
        isbn = isbn13?.identifier || isbn10?.identifier;
      }

      // 価格を取得（JPYのみ対応）
      let listPrice: number | undefined;
      const saleInfo = item.saleInfo;
      if (saleInfo?.listPrice?.currencyCode === 'JPY') {
        listPrice = saleInfo.listPrice.amount;
      } else if (saleInfo?.retailPrice?.currencyCode === 'JPY') {
        listPrice = saleInfo.retailPrice.amount;
      }

      return {
        isbn,
        title: book.title,
        authors: book.authors || [],
        publisher: book.publisher,
        publishedDate: book.publishedDate,
        description: book.description,
        pageCount: book.pageCount,
        categories: book.categories,
        thumbnailUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:'),
        listPrice,
      };
    });
  } catch (error) {
    if (error instanceof ApiError) {
      logError('GoogleBooksSearch', error);
    } else {
      logError('GoogleBooksSearch', error);
    }
    return [];
  }
}

// 後方互換性のためのラッパー関数
export async function searchByTitle(title: string): Promise<BookInfo[]> {
  return searchBooks({ title });
}

/**
 * ISBNから書影URLのみを取得する
 * 本の追加・更新時に画像がない場合に使用
 */
export async function fetchThumbnailByISBN(isbn: string): Promise<string | null> {
  const cleanIsbn = cleanAndValidateISBN(isbn);
  if (!cleanIsbn) return null;

  try {
    // OpenBDとGoogle Booksを並行して取得
    const [openBdResult, googleResult] = await Promise.all([
      searchOpenBD(cleanIsbn).catch(() => null),
      searchGoogleBooks(cleanIsbn).catch(() => null),
    ]);

    // OpenBDの画像を優先
    if (openBdResult?.thumbnailUrl) {
      return openBdResult.thumbnailUrl;
    }

    // なければGoogle Booksの画像を使用
    if (googleResult?.thumbnailUrl) {
      return googleResult.thumbnailUrl;
    }

    return null;
  } catch (error) {
    logError('fetchThumbnail', error);
    return null;
  }
}
