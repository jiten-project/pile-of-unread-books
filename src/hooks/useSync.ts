import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../contexts';
import { useBookStore } from '../store';
import { getAllBooks } from '../services/database';
import {
  SyncState,
  SyncResult,
  performFullSync,
  performIncrementalSync,
  performInitialSync,
} from '../services/syncService';
import { useNetworkStatus } from './useNetworkStatus';

// 同期の最小間隔（ミリ秒）
const MIN_SYNC_INTERVAL = 30000; // 30秒

export interface UseSyncReturn {
  syncState: SyncState;
  lastSyncTime: Date | null;
  lastSyncResult: SyncResult | null;
  isSyncEnabled: boolean;
  triggerSync: () => Promise<void>;
  triggerFullSync: () => Promise<void>;
}

/**
 * 同期機能を提供するフック
 */
export function useSync(): UseSyncReturn {
  const { user } = useAuth();
  const { setBooks } = useBookStore();
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();

  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [hasInitialSynced, setHasInitialSynced] = useState(false);

  const syncInProgressRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);

  const isSyncEnabled = !!user && isOnline;

  // 同期実行（内部用）
  const executeSync = useCallback(async (fullSync: boolean = false): Promise<SyncResult | null> => {
    if (!user || syncInProgressRef.current) {
      return null;
    }

    // 最小間隔チェック（フル同期時はスキップ）
    const now = Date.now();
    if (!fullSync && now - lastSyncTimeRef.current < MIN_SYNC_INTERVAL) {
      return null;
    }

    syncInProgressRef.current = true;
    setSyncState('syncing');

    try {
      const result = fullSync
        ? await performFullSync(user.id)
        : await performIncrementalSync(user.id);

      setLastSyncTime(new Date());
      setLastSyncResult(result);
      lastSyncTimeRef.current = now;

      // 同期後にローカルデータを再読み込み（ダウンロードまたは削除があった場合）
      if (result.downloaded > 0 || result.deleted > 0) {
        const books = await getAllBooks();
        setBooks(books);
      }

      setSyncState(result.success ? 'idle' : 'error');
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncState('error');
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        deleted: 0,
        conflicts: 0,
        errors: [String(error)],
      };
    } finally {
      syncInProgressRef.current = false;
    }
  }, [user, setBooks]);

  // 差分同期をトリガー
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      setSyncState('offline');
      return;
    }
    await executeSync(false);
  }, [isOnline, executeSync]);

  // フル同期をトリガー
  const triggerFullSync = useCallback(async () => {
    if (!isOnline) {
      setSyncState('offline');
      return;
    }
    await executeSync(true);
  }, [isOnline, executeSync]);

  // 初回同期（ログイン時）
  useEffect(() => {
    if (user && isOnline && !hasInitialSynced) {
      const doInitialSync = async () => {
        syncInProgressRef.current = true;
        setSyncState('syncing');

        try {
          const result = await performInitialSync(user.id);
          setLastSyncTime(new Date());
          setLastSyncResult(result);
          lastSyncTimeRef.current = Date.now();

          // 同期後にローカルデータを再読み込み
          const books = await getAllBooks();
          setBooks(books);

          setSyncState(result.success ? 'idle' : 'error');
          setHasInitialSynced(true);
        } catch (error) {
          console.error('Initial sync failed:', error);
          setSyncState('error');
        } finally {
          syncInProgressRef.current = false;
        }
      };

      doInitialSync();
    }
  }, [user, isOnline, hasInitialSynced, setBooks]);

  // ユーザーがログアウトした場合はリセット
  useEffect(() => {
    if (!user) {
      setHasInitialSynced(false);
      setSyncState('idle');
      setLastSyncTime(null);
      setLastSyncResult(null);
    }
  }, [user]);

  // オフラインから復帰した場合に同期
  useEffect(() => {
    if (wasOffline && isOnline && user && hasInitialSynced) {
      clearWasOffline();
      executeSync(true); // オフライン復帰時はフル同期
    }
  }, [wasOffline, isOnline, user, hasInitialSynced, clearWasOffline, executeSync]);

  // アプリがフォアグラウンドに戻った時に同期
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user && isOnline && hasInitialSynced) {
        // フォアグラウンド復帰時は差分同期
        executeSync(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, isOnline, hasInitialSynced, executeSync]);

  // ネットワーク状態に応じて syncState を更新
  useEffect(() => {
    if (!isOnline && syncState !== 'syncing') {
      setSyncState('offline');
    } else if (isOnline && syncState === 'offline') {
      setSyncState('idle');
    }
  }, [isOnline, syncState]);

  return {
    syncState,
    lastSyncTime,
    lastSyncResult,
    isSyncEnabled,
    triggerSync,
    triggerFullSync,
  };
}
