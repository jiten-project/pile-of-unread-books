import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts';
import { SyncState } from '../services/syncService';

interface SyncIndicatorProps {
  syncState: SyncState;
  onPress?: () => void;
}

export default function SyncIndicator({ syncState, onPress }: SyncIndicatorProps) {
  const { colors } = useTheme();

  if (syncState === 'idle') {
    return null;
  }

  const getContent = () => {
    switch (syncState) {
      case 'syncing':
        return (
          <View style={styles.content}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.text, { color: colors.primary }]}>同期中...</Text>
          </View>
        );
      case 'error':
        return (
          <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={[styles.text, { color: colors.warning }]}>同期エラー</Text>
          </TouchableOpacity>
        );
      case 'offline':
        return (
          <View style={styles.content}>
            <Text style={styles.icon}>📴</Text>
            <Text style={[styles.text, { color: colors.textTertiary }]}>オフライン</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {getContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
