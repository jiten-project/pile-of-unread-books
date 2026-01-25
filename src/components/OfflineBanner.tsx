import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts';

interface OfflineBannerProps {
  isVisible: boolean;
}

export default function OfflineBanner({ isVisible }: OfflineBannerProps) {
  const { colors } = useTheme();

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.warning }]}>
      <Text style={styles.text}>
        オフラインです。変更は接続時に同期されます。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
