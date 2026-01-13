// 書籍のステータス
export type BookStatus = 'unread' | 'reading' | 'paused' | 'completed';

// 優先度
export type Priority = 'high' | 'medium' | 'low';

// 本の状態（新刊・古本・電子書籍・その他）
export type BookCondition = 'new' | 'used' | 'ebook' | 'other';

// 書籍の基本情報（API から取得）
export interface BookInfo {
  isbn?: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  thumbnailUrl?: string;
  categories?: string[];
}

// ユーザーが入力する情報
export interface UserBookData {
  status: BookStatus;
  priority: Priority;
  condition: BookCondition;
  purchaseDate?: string;
  purchasePlace?: string;
  purchasePrice?: number;
  purchaseReason?: string;
  tags: string[];
  notes?: string;
  startDate?: string;
  completedDate?: string;
  currentPage?: number;
}

// 完全な書籍データ
export interface Book extends BookInfo, UserBookData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// 新規書籍登録時の入力
export type CreateBookInput = BookInfo & Partial<UserBookData>;

// 書籍更新時の入力
export type UpdateBookInput = Partial<BookInfo & UserBookData>;
