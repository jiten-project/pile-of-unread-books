// アプリ共通のテーマカラー
export const COLORS = {
  // プライマリカラー
  primary: '#007AFF',
  primaryLight: '#e3f2fd',

  // 背景色
  background: '#f5f5f5',
  surface: '#fff',

  // テキスト
  textPrimary: '#333',
  textSecondary: '#666',
  textTertiary: '#999',

  // ボーダー
  border: '#e0e0e0',
  borderLight: '#f0f0f0',

  // エラー/警告/成功
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',

  // その他
  disabled: '#ccc',
  placeholder: '#999',
} as const;

// 共通のシャドウスタイル
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// 共通のスペーシング
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// 共通のボーダー半径
export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// フォントサイズ
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 28,
} as const;
