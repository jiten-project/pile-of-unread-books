import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookStatus } from '../types';

// 積読の定義設定
export interface TsundokuDefinition {
  // どのステータスを積読としてカウントするか
  includeUnread: boolean;    // 未読
  includeReading: boolean;   // 読書中
  includePaused: boolean;    // 中断
}

// デフォルト: 未読のみを積読とする
const DEFAULT_TSUNDOKU_DEFINITION: TsundokuDefinition = {
  includeUnread: true,
  includeReading: false,
  includePaused: false,
};

// プリセット定義
export const TSUNDOKU_PRESETS = {
  strict: {
    name: '厳格派',
    description: '未読のみが積読',
    definition: { includeUnread: true, includeReading: false, includePaused: false },
  },
  moderate: {
    name: '中間派',
    description: '未読と中断が積読',
    definition: { includeUnread: true, includeReading: false, includePaused: true },
  },
  relaxed: {
    name: 'ゆるふわ派',
    description: '読了以外はすべて積読',
    definition: { includeUnread: true, includeReading: true, includePaused: true },
  },
} as const;

export type TsundokuPresetKey = keyof typeof TSUNDOKU_PRESETS;

interface SettingsContextType {
  tsundokuDefinition: TsundokuDefinition;
  setTsundokuDefinition: (definition: TsundokuDefinition) => Promise<void>;
  isTsundoku: (status: BookStatus) => boolean;
  getTsundokuStatuses: () => BookStatus[];
  currentPreset: TsundokuPresetKey | 'custom';
  showReleasedInBookshelf: boolean;
  setShowReleasedInBookshelf: (show: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const TSUNDOKU_DEFINITION_KEY = '@tsundoku_definition';
const SHOW_RELEASED_KEY = '@show_released_in_bookshelf';

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [tsundokuDefinition, setTsundokuDefinitionState] = useState<TsundokuDefinition>(
    DEFAULT_TSUNDOKU_DEFINITION
  );
  const [showReleasedInBookshelf, setShowReleasedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedTsundoku, savedShowReleased] = await Promise.all([
        AsyncStorage.getItem(TSUNDOKU_DEFINITION_KEY),
        AsyncStorage.getItem(SHOW_RELEASED_KEY),
      ]);
      if (savedTsundoku) {
        const parsed = JSON.parse(savedTsundoku);
        setTsundokuDefinitionState(parsed);
      }
      if (savedShowReleased !== null) {
        setShowReleasedState(JSON.parse(savedShowReleased));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTsundokuDefinition = async (definition: TsundokuDefinition) => {
    try {
      await AsyncStorage.setItem(TSUNDOKU_DEFINITION_KEY, JSON.stringify(definition));
      setTsundokuDefinitionState(definition);
    } catch (error) {
      console.error('Failed to save tsundoku definition:', error);
    }
  };

  const setShowReleasedInBookshelf = async (show: boolean) => {
    try {
      await AsyncStorage.setItem(SHOW_RELEASED_KEY, JSON.stringify(show));
      setShowReleasedState(show);
    } catch (error) {
      console.error('Failed to save show released setting:', error);
    }
  };

  // 指定したステータスが積読かどうかを判定
  const isTsundoku = (status: BookStatus): boolean => {
    switch (status) {
      case 'unread':
        return tsundokuDefinition.includeUnread;
      case 'reading':
        return tsundokuDefinition.includeReading;
      case 'paused':
        return tsundokuDefinition.includePaused;
      case 'completed':
        return false; // 読了は常に積読ではない
      default:
        return false;
    }
  };

  // 積読としてカウントするステータスの配列を取得
  const getTsundokuStatuses = (): BookStatus[] => {
    const statuses: BookStatus[] = [];
    if (tsundokuDefinition.includeUnread) statuses.push('unread');
    if (tsundokuDefinition.includeReading) statuses.push('reading');
    if (tsundokuDefinition.includePaused) statuses.push('paused');
    return statuses;
  };

  // 現在の設定がどのプリセットに該当するか
  const currentPreset = useMemo((): TsundokuPresetKey | 'custom' => {
    for (const [key, preset] of Object.entries(TSUNDOKU_PRESETS)) {
      const def = preset.definition;
      if (
        def.includeUnread === tsundokuDefinition.includeUnread &&
        def.includeReading === tsundokuDefinition.includeReading &&
        def.includePaused === tsundokuDefinition.includePaused
      ) {
        return key as TsundokuPresetKey;
      }
    }
    return 'custom';
  }, [tsundokuDefinition]);

  const value = useMemo(
    () => ({
      tsundokuDefinition,
      setTsundokuDefinition,
      isTsundoku,
      getTsundokuStatuses,
      currentPreset,
      showReleasedInBookshelf,
      setShowReleasedInBookshelf,
    }),
    [tsundokuDefinition, currentPreset, showReleasedInBookshelf]
  );

  if (isLoading) {
    return null;
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
