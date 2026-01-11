import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// テーマの種類
export type ThemeMode = 'light' | 'dark' | 'system';

// カラーテーマの型定義
export interface ThemeColors {
  // プライマリカラー
  primary: string;
  primaryLight: string;

  // 背景色
  background: string;
  surface: string;
  card: string;

  // テキスト
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // ボーダー
  border: string;
  borderLight: string;

  // エラー/警告/成功
  error: string;
  warning: string;
  success: string;

  // その他
  disabled: string;
  placeholder: string;

  // ステータスバー
  statusBar: 'light-content' | 'dark-content';
}

// ライトテーマ（WCAG AA準拠のコントラスト比を確保）
export const lightTheme: ThemeColors = {
  primary: '#0066CC',
  primaryLight: '#e3f2fd',
  background: '#f5f5f5',
  surface: '#fff',
  card: '#fff',
  textPrimary: '#1a1a1a',
  textSecondary: '#555',
  textTertiary: '#777',
  border: '#d0d0d0',
  borderLight: '#e8e8e8',
  error: '#D32F2F',
  warning: '#E65100',
  success: '#2E7D32',
  disabled: '#9e9e9e',
  placeholder: '#757575',
  statusBar: 'dark-content',
};

// ダークテーマ
export const darkTheme: ThemeColors = {
  primary: '#0A84FF',
  primaryLight: '#1a3a5c',
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2c2c2c',
  textPrimary: '#f5f5f5',
  textSecondary: '#c0c0c0',
  textTertiary: '#a0a0a0',
  border: '#3c3c3c',
  borderLight: '#2c2c2c',
  error: '#FF6B6B',
  warning: '#FFB347',
  success: '#69DB7C',
  disabled: '#666',
  placeholder: '#888',
  statusBar: 'light-content',
};

// コンテキストの型
interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@tsundoku_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にAsyncStorageから設定を読み込み
  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  // 実際に使用するテーマを決定
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      colors,
      setThemeMode,
    }),
    [themeMode, isDark, colors]
  );

  // ローディング中は何も表示しない（または適切なローディング表示）
  if (isLoading) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
