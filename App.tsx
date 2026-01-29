import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RootNavigator } from './src/navigation';
import { useDatabase, useAppUpdate, useWhatsNew } from './src/hooks';
import { ThemeProvider, SettingsProvider, AuthProvider, SyncProvider, useTheme } from './src/contexts';
import { WhatsNewModal } from './src/components/WhatsNewModal';

function AppContent() {
  const { isReady } = useDatabase();
  const { colors, isDark } = useTheme();
  const { shouldShowModal, changelog, markAsShown } = useWhatsNew();

  // App Storeのアップデートチェック（バックグラウンドで実行）
  useAppUpdate();

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // データベース初期化完了後にSyncProviderをマウント
  return (
    <SyncProvider>
      <RootNavigator />
      {changelog && (
        <WhatsNewModal
          visible={shouldShowModal}
          changelog={changelog}
          onClose={markAsShown}
        />
      )}
    </SyncProvider>
  );
}

function ThemedApp() {
  const { isDark, colors } = useTheme();

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.textPrimary,
          border: colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.textPrimary,
          border: colors.border,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppContent />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
