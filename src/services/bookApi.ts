import { BookInfo } from '../types';

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const OPENBD_API = 'https://api.openbd.jp/v1/get';

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
  };
}

export async function searchByISBN(isbn: string): Promise<BookInfo | null> {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');

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
    const response = await fetch(`${OPENBD_API}?isbn=${isbn}`);
    const data: OpenBDResponse[] = await response.json();

    if (!data || !data[0] || !data[0].summary) {
      return null;
    }

    const book = data[0];
    const summary = book.summary!;

    // ページ数を取得
    let pageCount: number | undefined;
    const extents = book.onix?.DescriptiveDetail?.Extent;
    if (extents) {
      const pageExtent = extents.find(e => e.ExtentType === '00');
      if (pageExtent?.ExtentValue) {
        pageCount = parseInt(pageExtent.ExtentValue, 10);
      }
    }

    // 説明を取得
    let description: string | undefined;
    const textContents = book.onix?.CollateralDetail?.TextContent;
    if (textContents && textContents.length > 0) {
      description = textContents[0].Text;
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
    };
  } catch (error) {
    console.error('OpenBD API error:', error);
    return null;
  }
}

async function searchGoogleBooks(isbn: string): Promise<BookInfo | null> {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}`);
    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const book = data.items[0].volumeInfo;

    // ISBNを取得
    let bookIsbn = isbn;
    if (book.industryIdentifiers) {
      const isbn13 = book.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = book.industryIdentifiers.find(id => id.type === 'ISBN_10');
      bookIsbn = isbn13?.identifier || isbn10?.identifier || isbn;
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
    };
  } catch (error) {
    console.error('Google Books API error:', error);
    return null;
  }
}

export async function searchByTitle(title: string): Promise<BookInfo[]> {
  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(title)}&maxResults=10&langRestrict=ja`
    );
    const data: GoogleBooksResponse = await response.json();

    if (!data.items) {
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
      };
    });
  } catch (error) {
    console.error('Google Books search error:', error);
    return [];
  }
}
