import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * ネットワーク状態を監視するフック
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // 初期状態を取得
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // 状態変更を監視
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;

      setNetworkStatus(prev => {
        // オフラインからオンラインに復帰した場合
        if (!prev.isConnected && isOnline) {
          setWasOffline(true);
        }

        return {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        };
      });
    });

    return () => unsubscribe();
  }, []);

  // オフライン復帰フラグをリセット
  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  const isOnline = networkStatus.isConnected && networkStatus.isInternetReachable !== false;

  return {
    ...networkStatus,
    isOnline,
    wasOffline,
    clearWasOffline,
  };
}
