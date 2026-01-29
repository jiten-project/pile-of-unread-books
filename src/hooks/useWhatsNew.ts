import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  ChangelogEntry,
  getChangelogForVersion,
  compareVersions,
} from '../constants/changelog';

const LAST_SHOWN_VERSION_KEY = '@whatsNew_lastShownVersion';

interface UseWhatsNewReturn {
  /** モーダルを表示すべきかどうか */
  shouldShowModal: boolean;
  /** 表示する変更履歴 */
  changelog: ChangelogEntry | null;
  /** お知らせを確認済みとしてマーク */
  markAsShown: () => Promise<void>;
  /** 初期化完了フラグ */
  isReady: boolean;
}

/**
 * バージョンアップお知らせ機能のカスタムフック
 *
 * 処理フロー:
 * 1. AsyncStorageから前回表示したバージョンを取得
 * 2. 初回インストール（前回バージョンがnull）の場合は現在のバージョンを保存して終了
 * 3. 現在のバージョンが前回より新しい場合、changelogを確認
 * 4. changelogに現在バージョンの情報があればモーダルを表示
 */
export const useWhatsNew = (): UseWhatsNewReturn => {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry | null>(null);
  const [isReady, setIsReady] = useState(false);

  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const lastShownVersion = await AsyncStorage.getItem(
          LAST_SHOWN_VERSION_KEY
        );

        // 初回インストールの場合
        if (lastShownVersion === null) {
          // バージョンを保存して終了（モーダルは表示しない）
          await AsyncStorage.setItem(LAST_SHOWN_VERSION_KEY, currentVersion);
          setIsReady(true);
          return;
        }

        // バージョンが新しいかチェック
        if (compareVersions(currentVersion, lastShownVersion) > 0) {
          // 現在バージョンの変更履歴を取得
          const entry = getChangelogForVersion(currentVersion);

          if (entry) {
            // 変更履歴があればモーダル表示
            setChangelog(entry);
            setShouldShowModal(true);
          } else {
            // 変更履歴がなければバージョンのみ更新
            await AsyncStorage.setItem(LAST_SHOWN_VERSION_KEY, currentVersion);
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error('Error checking version for WhatsNew:', error);
        setIsReady(true);
      }
    };

    checkVersion();
  }, [currentVersion]);

  const markAsShown = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_SHOWN_VERSION_KEY, currentVersion);
      setShouldShowModal(false);
      setChangelog(null);
    } catch (error) {
      console.error('Error marking WhatsNew as shown:', error);
    }
  }, [currentVersion]);

  return {
    shouldShowModal,
    changelog,
    markAsShown,
    isReady,
  };
};
