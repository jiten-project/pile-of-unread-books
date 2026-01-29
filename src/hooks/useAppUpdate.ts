import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../utils/logger';

const LAST_CHECK_KEY = '@appUpdate_lastCheck';
const SKIPPED_VERSION_KEY = '@appUpdate_skippedVersion';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24時間

// App Store設定
const BUNDLE_ID = Constants.expoConfig?.ios?.bundleIdentifier || '';
const APP_STORE_ID = Constants.expoConfig?.extra?.appStoreId || '';

interface AppStoreResponse {
  resultCount: number;
  results: Array<{
    version: string;
    trackViewUrl: string;
    releaseNotes?: string;
  }>;
}

/**
 * バージョン文字列を比較
 * @returns v1 > v2 なら 1, v1 < v2 なら -1, 等しいなら 0
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

interface UseAppUpdateReturn {
  /** アップデートが利用可能か */
  updateAvailable: boolean;
  /** 最新バージョン */
  latestVersion: string | null;
  /** アップデートをチェック */
  checkForUpdate: () => Promise<void>;
  /** App Storeを開く */
  openAppStore: () => void;
  /** このバージョンをスキップ */
  skipVersion: () => Promise<void>;
  /** チェック中かどうか */
  isChecking: boolean;
}

/**
 * App Storeのアップデートをチェックするフック
 */
export const useAppUpdate = (): UseAppUpdateReturn => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const storeUrlRef = useRef<string | null>(null);
  const hasShownAlertRef = useRef(false);

  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

  const checkForUpdate = useCallback(async (force = false) => {
    // iOSのみ対応、Bundle IDが未設定の場合はスキップ
    if (Platform.OS !== 'ios' || !BUNDLE_ID) return;

    setIsChecking(true);

    try {
      // 最後のチェックから24時間経過していない場合はスキップ
      if (!force) {
        const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
        if (lastCheck) {
          const lastCheckTime = parseInt(lastCheck, 10);
          if (Date.now() - lastCheckTime < CHECK_INTERVAL_MS) {
            setIsChecking(false);
            return;
          }
        }
      }

      // iTunes APIでApp Storeの情報を取得
      const response = await fetch(
        `https://itunes.apple.com/lookup?bundleId=${BUNDLE_ID}&country=jp`
      );
      const data: AppStoreResponse = await response.json();

      if (data.resultCount > 0) {
        const storeInfo = data.results[0];
        const storeVersion = storeInfo.version;
        setLatestVersion(storeVersion);
        storeUrlRef.current = storeInfo.trackViewUrl;

        // スキップされたバージョンかチェック
        const skippedVersion = await AsyncStorage.getItem(SKIPPED_VERSION_KEY);
        if (skippedVersion === storeVersion) {
          setUpdateAvailable(false);
          setIsChecking(false);
          await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
          return;
        }

        // バージョン比較
        if (compareVersions(storeVersion, currentVersion) > 0) {
          setUpdateAvailable(true);
        } else {
          setUpdateAvailable(false);
        }
      }

      // 最後のチェック時刻を保存
      await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
    } catch (error) {
      logError('appUpdate:check', error);
    } finally {
      setIsChecking(false);
    }
  }, [currentVersion]);

  const openAppStore = useCallback(() => {
    // APIから取得したURLを優先、なければApp Store IDから構築
    let url = storeUrlRef.current;
    if (!url && APP_STORE_ID) {
      url = `https://apps.apple.com/app/id${APP_STORE_ID}`;
    }

    if (url) {
      Linking.openURL(url).catch((error) => {
        logError('appUpdate:openStore', error);
      });
    }
  }, []);

  const skipVersion = useCallback(async () => {
    if (latestVersion) {
      await AsyncStorage.setItem(SKIPPED_VERSION_KEY, latestVersion);
      setUpdateAvailable(false);
    }
  }, [latestVersion]);

  const showUpdateAlert = useCallback(() => {
    if (!updateAvailable || !latestVersion || hasShownAlertRef.current) return;

    hasShownAlertRef.current = true;

    Alert.alert(
      'アップデートのお知らせ',
      `新しいバージョン ${latestVersion} が利用可能です。\n\n現在のバージョン: ${currentVersion}`,
      [
        {
          text: '後で',
          style: 'cancel',
        },
        {
          text: 'スキップ',
          onPress: skipVersion,
        },
        {
          text: 'アップデート',
          onPress: openAppStore,
        },
      ]
    );
  }, [updateAvailable, latestVersion, currentVersion, skipVersion, openAppStore]);

  // 初回チェック
  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  // アップデートがある場合にアラート表示
  useEffect(() => {
    if (updateAvailable && latestVersion) {
      showUpdateAlert();
    }
  }, [updateAvailable, latestVersion, showUpdateAlert]);

  return {
    updateAvailable,
    latestVersion,
    checkForUpdate: () => checkForUpdate(true),
    openAppStore,
    skipVersion,
    isChecking,
  };
};
