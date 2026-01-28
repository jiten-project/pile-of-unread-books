import { BookStatus, Priority, BookCondition } from '../types';

export const STATUS_LABELS: Record<BookStatus, string> = {
  wishlist: 'ほしい',
  unread: '未読',
  reading: '読書中',
  paused: '中断',
  completed: '読了',
  released: '解放',
};

export const STATUS_ICONS: Record<BookStatus, string> = {
  wishlist: 'heart-outline',
  unread: 'book-multiple',
  reading: 'book-open-page-variant',
  paused: 'pause-circle',
  completed: 'check-circle',
  released: 'book-arrow-right',
};

export const STATUS_COLORS: Record<BookStatus, string> = {
  wishlist: '#F06292',
  unread: '#FF9800',
  reading: '#2196F3',
  paused: '#9E9E9E',
  completed: '#4CAF50',
  released: '#9C27B0',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#F44336',
  medium: '#FF9800',
  low: '#4CAF50',
};

export const CONDITION_LABELS: Record<BookCondition, string> = {
  new: '新刊',
  used: '古本',
  ebook: '電子書籍',
  other: 'その他',
};

export const CONDITION_COLORS: Record<BookCondition, string> = {
  new: '#2196F3',
  used: '#795548',
  ebook: '#00BCD4',
  other: '#9E9E9E',
};
