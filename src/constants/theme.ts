import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

// 基準画面幅（iPhone 14: 390px）
const BASE_WIDTH = 390;

// スケールファクター（画面幅に応じて自動調整）
// 例: iPhone SE (375px) = 0.96x, iPhone 14 (390px) = 1.0x, iPad (1024px) = 2.62x
// 最小 0.85x、最大 1.5x に制限
const rawScale = screenWidth / BASE_WIDTH;
const scaleFactor = Math.min(Math.max(rawScale, 0.85), 1.5);

// デバイス種別判定
const isTablet = screenWidth > 600;

// iPad用スケールファクター（iPhoneと同じサイズで、レイアウトで対応）
const tabletScale = 1.0;

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

// フォントサイズ（iPad対応：自動スケーリング）
export const FONT_SIZE = {
  xs: Math.round(10 * scaleFactor),
  sm: Math.round(12 * scaleFactor),
  md: Math.round(14 * scaleFactor),
  lg: Math.round(16 * scaleFactor),
  xl: Math.round(18 * scaleFactor),
  xxl: Math.round(24 * scaleFactor),
  xxxl: Math.round(28 * scaleFactor),
} as const;

// デバイス情報のエクスポート
export const DEVICE = {
  isTablet,
  screenWidth,
  scaleFactor,
  tabletScale,
} as const;
