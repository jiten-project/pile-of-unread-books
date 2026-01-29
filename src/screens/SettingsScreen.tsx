import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useNavigation } from '@react-navigation/native';
import { useBookStore } from '../store';
import { usePersistBook } from '../hooks';
import { exportBooks, importBooks } from '../services';
import { insertBooksInTransaction, getAllBooks, deleteAllBooks } from '../services/database';
import { deleteAllBooksFromCloud } from '../services/cloudDatabase';
import { AppNavigationProp } from '../types';
import { useTheme, ThemeMode, useSettings, TSUNDOKU_PRESETS, TsundokuPresetKey, useAuth, useSyncContext } from '../contexts';
import { DEVICE } from '../constants';
import { logError } from '../utils/logger';

const isTablet = DEVICE.isTablet;

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'system', label: 'システム設定', icon: '📱' },
  { value: 'light', label: 'ライト', icon: '☀️' },
  { value: 'dark', label: 'ダーク', icon: '🌙' },
];

export default function SettingsScreen() {
  const { books, setBooks } = useBookStore();
  const navigation = useNavigation<AppNavigationProp>();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { tsundokuDefinition, setTsundokuDefinition, currentPreset, showWishlistInBookshelf, setShowWishlistInBookshelf, showReleasedInBookshelf, setShowReleasedInBookshelf, showMaturity, setShowMaturity } = useSettings();
  const { updateStatus } = usePersistBook();
  const { user, isLoading: isAuthLoading, isAppleAuthAvailable, signInWithApple, signOut } = useAuth();
  const { syncState, lastSyncTime, triggerFullSync, cloudSyncCount, cloudSyncLimit, isPremium } = useSyncContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await triggerFullSync();
      Alert.alert('同期完了', 'データの同期が完了しました');
    } catch (error) {
      Alert.alert('同期エラー', '同期に失敗しました。後でもう一度お試しください。');
      logError('settings:manualSync', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSyncTime = (date: Date | null): string => {
    if (!date) return '未同期';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  };
  const [isImporting, setIsImporting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithApple();
    } catch (error) {
      Alert.alert('サインインエラー', 'サインインに失敗しました。もう一度お試しください。');
      logError('settings:signIn', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'サインアウト',
      'クラウド同期が無効になります。ローカルデータは保持されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'サインアウト',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert('エラー', 'サインアウトに失敗しました');
              logError('settings:signOut', error);
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handlePresetSelect = (presetKey: TsundokuPresetKey) => {
    setTsundokuDefinition(TSUNDOKU_PRESETS[presetKey].definition);
  };

  const handleWishlistToggle = async (value: boolean) => {
    if (!value) {
      // OFFにする場合、wishlistステータスの本を未読に変更
      const wishlistBooks = books.filter(b => b.status === 'wishlist');
      for (const book of wishlistBooks) {
        await updateStatus(book.id, 'unread');
      }
    }
    setShowWishlistInBookshelf(value);
  };

  const handleReleasedToggle = async (value: boolean) => {
    if (!value) {
      // OFFにする場合、releasedステータスの本を未読に変更
      const releasedBooks = books.filter(b => b.status === 'released');
      for (const book of releasedBooks) {
        await updateStatus(book.id, 'unread');
      }
    }
    setShowReleasedInBookshelf(value);
  };

  const handleExport = async () => {
    if (books.length === 0) {
      Alert.alert('エクスポート', 'エクスポートするデータがありません');
      return;
    }

    setIsExporting(true);
    try {
      await exportBooks(books);
    } catch (error) {
      Alert.alert('エラー', 'データのエクスポートに失敗しました');
      logError('settings:export', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'データのインポート',
      '既存のデータに追加されます。同じIDの本は上書きされます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'インポート',
          onPress: async () => {
            setIsImporting(true);
            try {
              const importedBooks = await importBooks();
              if (!importedBooks) {
                return;
              }

              // 既存のIDを取得
              const existingIds = new Set(books.map(b => b.id));

              // インポート処理（カウント計算）
              let addedCount = 0;
              let updatedCount = 0;

              for (const book of importedBooks) {
                if (existingIds.has(book.id)) {
                  updatedCount++;
                } else {
                  addedCount++;
                }
              }

              // トランザクションで一括挿入（パフォーマンス向上）
              await insertBooksInTransaction(importedBooks);

              // ストアを更新
              const allBooks = await getAllBooks();
              setBooks(allBooks);

              Alert.alert(
                'インポート完了',
                `${addedCount}冊を追加、${updatedCount}冊を更新しました`
              );
            } catch (error) {
              Alert.alert('エラー', 'データのインポートに失敗しました');
              logError('settings:import', error);
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    // 未ログイン時のみ早期リターン（クラウドデータがないため）
    if (!user && books.length === 0) {
      Alert.alert('削除', '削除するデータがありません');
      return;
    }

    const deleteLocalOnly = async () => {
      try {
        await deleteAllBooks();
        setBooks([]);
        Alert.alert('完了', 'ローカルデータを削除しました');
      } catch (error) {
        Alert.alert('エラー', 'データの削除に失敗しました');
        logError('settings:deleteLocal', error);
      }
    };

    const deleteCloudOnly = async () => {
      try {
        await deleteAllBooksFromCloud();
        Alert.alert('完了', 'クラウドデータを削除しました');
      } catch (error) {
        Alert.alert('エラー', 'クラウドデータの削除に失敗しました');
        logError('settings:deleteCloud', error);
      }
    };

    const deleteLocalAndCloud = async () => {
      try {
        // クラウドを先に削除（失敗した場合、ローカルデータは保持される）
        await deleteAllBooksFromCloud();
        await deleteAllBooks();
        setBooks([]);
        Alert.alert('完了', 'ローカルとクラウドのデータをすべて削除しました');
      } catch (error) {
        Alert.alert('エラー', 'データの削除に失敗しました。再度お試しください。');
        logError('settings:deleteAll', error);
      }
    };

    if (user) {
      if (books.length === 0) {
        // ログイン中でローカル空: クラウドのみ削除可能
        Alert.alert(
          'クラウドデータを削除',
          'ローカルにデータはありません。クラウドデータを削除しますか？',
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: 'クラウドを削除',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  '最終確認',
                  'クラウドデータを削除すると、他のデバイスからもデータが消えます。本当に削除しますか？',
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '削除する',
                      style: 'destructive',
                      onPress: deleteCloudOnly,
                    },
                  ]
                );
              },
            },
          ]
        );
      } else {
        // ログイン中でローカルあり: クラウドも削除するか選択
        Alert.alert(
          'すべてのデータを削除',
          `${books.length}冊のデータを削除します。クラウドデータも削除しますか？`,
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: 'ローカルのみ',
              onPress: () => {
                // ローカルのみ削除時の警告: 次回同期でデータが戻ることを説明
                Alert.alert(
                  '注意',
                  'ローカルデータを削除しても、次回同期時にクラウドからデータが復元されます。\n\nこのデバイスからデータを完全に削除するには、削除後にサインアウトしてください。',
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '削除のみ',
                      onPress: deleteLocalOnly,
                    },
                    {
                      text: '削除してサインアウト',
                      style: 'destructive',
                      onPress: async () => {
                        await deleteLocalOnly();
                        try {
                          await signOut();
                        } catch (error) {
                          Alert.alert('エラー', 'サインアウトに失敗しました');
                          logError('settings:signOutFailed', error);
                        }
                      },
                    },
                  ]
                );
              },
            },
            {
              text: 'クラウドも削除',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  '最終確認',
                  'クラウドデータを削除すると、他のデバイスからもデータが消えます。本当に削除しますか？',
                  [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '削除する',
                      style: 'destructive',
                      onPress: deleteLocalAndCloud,
                    },
                  ]
                );
              },
            },
          ]
        );
      }
    } else {
      // 未ログイン: ローカルのみ削除
      Alert.alert(
        'すべてのデータを削除',
        `本当に${books.length}冊のデータをすべて削除しますか？この操作は取り消せません。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '削除する',
            style: 'destructive',
            onPress: deleteLocalOnly,
          },
        ]
      );
    }
  };

  const themedStyles = {
    container: { backgroundColor: colors.background },
    section: { backgroundColor: colors.surface },
    sectionTitle: { color: colors.textSecondary },
    menuIcon: { backgroundColor: colors.background },
    menuLabel: { color: colors.textPrimary },
    menuDescription: { color: colors.textTertiary },
    menuArrow: { color: colors.disabled },
    menuBorder: { borderBottomColor: colors.borderLight },
    infoLabel: { color: colors.textPrimary },
    infoValue: { color: colors.textSecondary },
    footer: { color: colors.textTertiary },
    themeActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    themeInactive: { backgroundColor: colors.background, borderColor: colors.border },
    themeActiveText: { color: colors.primary },
    themeInactiveText: { color: colors.textSecondary },
  };

  // iPad用の拡大スタイル
  const tabletStyles = isTablet ? {
    content: { padding: 32, paddingBottom: 80 },
    section: { borderRadius: 20, marginBottom: 32 },
    sectionTitle: { fontSize: 26, paddingHorizontal: 28, paddingTop: 28, paddingBottom: 16 },
    sectionDescription: { fontSize: 20, paddingHorizontal: 28, paddingBottom: 20 },
    themeSelector: { padding: 28, gap: 20 },
    themeOption: { paddingVertical: 28, minHeight: 120, borderRadius: 20 },
    themeIcon: { fontSize: 48, marginBottom: 16 },
    themeLabel: { fontSize: 20 },
    presetSelector: { paddingHorizontal: 28, paddingBottom: 28, gap: 18 },
    presetOption: { paddingVertical: 24, paddingHorizontal: 28, borderRadius: 20, minHeight: 88 },
    presetName: { fontSize: 22, marginBottom: 8 },
    presetDescription: { fontSize: 18 },
    currentDefinition: { marginHorizontal: 28, marginBottom: 28, padding: 24, borderRadius: 16 },
    currentDefinitionTitle: { fontSize: 18, marginBottom: 14 },
    statusIncluded: { fontSize: 20 },
    statusExcluded: { fontSize: 20 },
    statusList: { gap: 20 },
    switchRow: { paddingHorizontal: 28, paddingVertical: 24 },
    switchLabel: { fontSize: 22 },
    switchDescription: { fontSize: 18, marginTop: 8 },
    menuItem: { padding: 28, minHeight: 88 },
    menuIcon: { width: 60, height: 60, borderRadius: 16, marginRight: 20 },
    menuIconText: { fontSize: 34 },
    menuLabel: { fontSize: 22 },
    menuDescription: { fontSize: 18, marginTop: 8 },
    menuArrow: { fontSize: 34 },
    infoRow: { padding: 28 },
    infoLabel: { fontSize: 22 },
    infoValue: { fontSize: 22 },
    footer: { fontSize: 18, marginTop: 40 },
    cloudSyncContent: { padding: 28 },
    cloudSyncDescription: { fontSize: 20, lineHeight: 32, marginBottom: 24 },
    cloudSyncFeature: { fontSize: 19, lineHeight: 34 },
    cloudSyncFeatures: { marginBottom: 28 },
    appleButton: { width: 360, height: 60 },
    appleButtonLoading: { width: 360, height: 60 },
    cloudSyncNote: { fontSize: 18 },
    syncStatus: { padding: 24, borderRadius: 16, marginBottom: 24 },
    syncStatusIcon: { fontSize: 34, marginRight: 20 },
    syncStatusTitle: { fontSize: 22 },
    syncStatusEmail: { fontSize: 19, marginTop: 8 },
    syncInfoRow: { paddingVertical: 20, marginBottom: 20 },
    syncInfoLabel: { fontSize: 20 },
    syncInfoValue: { fontSize: 20 },
    syncButton: { paddingVertical: 20, borderRadius: 16 },
    syncButtonText: { fontSize: 22 },
    signOutButton: { paddingVertical: 20, borderRadius: 16, marginTop: 16 },
    signOutButtonText: { fontSize: 22 },
    syncLimitWarning: { padding: 24, borderRadius: 16, marginBottom: 24 },
    syncLimitWarningText: { fontSize: 19, lineHeight: 30 },
  } : {};

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={[styles.content, tabletStyles.content]}
    >
      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>積読の定義</Text>
        <Text style={[styles.sectionDescription, tabletStyles.sectionDescription, { color: colors.textTertiary }]}>
          あなたにとっての「積読」とは？
        </Text>

        <View style={[styles.presetSelector, tabletStyles.presetSelector]}>
          {(Object.entries(TSUNDOKU_PRESETS) as [TsundokuPresetKey, typeof TSUNDOKU_PRESETS[TsundokuPresetKey]][]).map(
            ([key, preset]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.presetOption,
                  tabletStyles.presetOption,
                  currentPreset === key
                    ? themedStyles.themeActive
                    : themedStyles.themeInactive,
                ]}
                onPress={() => handlePresetSelect(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetName,
                    tabletStyles.presetName,
                    currentPreset === key
                      ? themedStyles.themeActiveText
                      : { color: colors.textPrimary },
                  ]}
                >
                  {preset.name}
                </Text>
                <Text
                  style={[
                    styles.presetDescription,
                    tabletStyles.presetDescription,
                    currentPreset === key
                      ? { color: colors.primary }
                      : { color: colors.textTertiary },
                  ]}
                >
                  {preset.description}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={[styles.currentDefinition, tabletStyles.currentDefinition, { backgroundColor: colors.background }]}>
          <Text style={[styles.currentDefinitionTitle, tabletStyles.currentDefinitionTitle, { color: colors.textSecondary }]}>
            現在の設定:
          </Text>
          <View style={[styles.statusList, tabletStyles.statusList]}>
            <View style={styles.statusItem}>
              <Text style={tsundokuDefinition.includeUnread ? [styles.statusIncluded, tabletStyles.statusIncluded] : [styles.statusExcluded, tabletStyles.statusExcluded, { color: colors.textTertiary }]}>
                {tsundokuDefinition.includeUnread ? '✓' : '−'} 未読
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={tsundokuDefinition.includeReading ? [styles.statusIncluded, tabletStyles.statusIncluded] : [styles.statusExcluded, tabletStyles.statusExcluded, { color: colors.textTertiary }]}>
                {tsundokuDefinition.includeReading ? '✓' : '−'} 読書中
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={tsundokuDefinition.includePaused ? [styles.statusIncluded, tabletStyles.statusIncluded] : [styles.statusExcluded, tabletStyles.statusExcluded, { color: colors.textTertiary }]}>
                {tsundokuDefinition.includePaused ? '✓' : '−'} 中断
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusExcluded, tabletStyles.statusExcluded, { color: colors.textTertiary }]}>
                − 読了
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>本棚の表示</Text>
        <View style={[styles.switchRow, tabletStyles.switchRow, { borderBottomColor: colors.border }]}>
          <View style={styles.switchLabelContainer}>
            <Text style={[styles.switchLabel, tabletStyles.switchLabel, { color: colors.textPrimary }]}>
              ほしい本を表示
            </Text>
            <Text style={[styles.switchDescription, tabletStyles.switchDescription, { color: colors.textTertiary }]}>
              「ほしい」ステータスの本を本棚に表示
            </Text>
          </View>
          <Switch
            value={showWishlistInBookshelf}
            onValueChange={handleWishlistToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={showWishlistInBookshelf ? '#fff' : '#f4f3f4'}
            style={isTablet ? { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] } : undefined}
          />
        </View>
        <View style={[styles.switchRow, tabletStyles.switchRow, { borderBottomColor: colors.border }]}>
          <View style={styles.switchLabelContainer}>
            <Text style={[styles.switchLabel, tabletStyles.switchLabel, { color: colors.textPrimary }]}>
              解放した本を表示
            </Text>
            <Text style={[styles.switchDescription, tabletStyles.switchDescription, { color: colors.textTertiary }]}>
              「解放」ステータスの本を本棚に表示
            </Text>
          </View>
          <Switch
            value={showReleasedInBookshelf}
            onValueChange={handleReleasedToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={showReleasedInBookshelf ? '#fff' : '#f4f3f4'}
            style={isTablet ? { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] } : undefined}
          />
        </View>
        <View style={[styles.switchRow, tabletStyles.switchRow, { borderBottomWidth: 0 }]}>
          <View style={styles.switchLabelContainer}>
            <Text style={[styles.switchLabel, tabletStyles.switchLabel, { color: colors.textPrimary }]}>
              熟成度を表示
            </Text>
            <Text style={[styles.switchDescription, tabletStyles.switchDescription, { color: colors.textTertiary }]}>
              積読日数に応じた熟成度を本の詳細に表示
            </Text>
          </View>
          <Switch
            value={showMaturity}
            onValueChange={setShowMaturity}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={showMaturity ? '#fff' : '#f4f3f4'}
            style={isTablet ? { transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] } : undefined}
          />
        </View>
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>通知</Text>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('NotificationSettings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>🔔</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>通知設定</Text>
            <Text style={[styles.menuDescription, tabletStyles.menuDescription, themedStyles.menuDescription]}>
              読書リマインダーの設定
            </Text>
          </View>
          <Text style={[styles.menuArrow, tabletStyles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>コンテンツ管理</Text>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('TagManagement')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>🏷️</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>タグ管理</Text>
            <Text style={[styles.menuDescription, tabletStyles.menuDescription, themedStyles.menuDescription]}>
              タグの編集・削除
            </Text>
          </View>
          <Text style={[styles.menuArrow, tabletStyles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>外観</Text>

        <View style={[styles.themeSelector, tabletStyles.themeSelector]}>
          {THEME_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                tabletStyles.themeOption,
                themeMode === option.value
                  ? themedStyles.themeActive
                  : themedStyles.themeInactive,
              ]}
              onPress={() => setThemeMode(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeIcon, tabletStyles.themeIcon]}>{option.icon}</Text>
              <Text
                style={[
                  styles.themeLabel,
                  tabletStyles.themeLabel,
                  themeMode === option.value
                    ? themedStyles.themeActiveText
                    : themedStyles.themeInactiveText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {Platform.OS === 'ios' && (
        <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>クラウド同期</Text>

          {isAuthLoading ? (
            <View style={styles.cloudSyncLoading}>
              <ActivityIndicator size={isTablet ? 'large' : 'small'} color={colors.primary} />
            </View>
          ) : user ? (
            <View style={[styles.cloudSyncContent, tabletStyles.cloudSyncContent]}>
              <View style={[styles.syncStatus, tabletStyles.syncStatus, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.syncStatusIcon, tabletStyles.syncStatusIcon]}>✓</Text>
                <View style={styles.syncStatusText}>
                  <Text style={[styles.syncStatusTitle, tabletStyles.syncStatusTitle, { color: colors.success }]}>
                    同期が有効です
                  </Text>
                  <Text style={[styles.syncStatusEmail, tabletStyles.syncStatusEmail, { color: colors.textSecondary }]}>
                    {user.email || 'Apple ID'}
                  </Text>
                </View>
              </View>

              <View style={[styles.syncInfoRow, tabletStyles.syncInfoRow, { borderColor: colors.borderLight }]}>
                <Text style={[styles.syncInfoLabel, tabletStyles.syncInfoLabel, { color: colors.textSecondary }]}>
                  最終同期
                </Text>
                <Text style={[styles.syncInfoValue, tabletStyles.syncInfoValue, { color: colors.textPrimary }]}>
                  {syncState === 'syncing' ? '同期中...' : formatLastSyncTime(lastSyncTime)}
                </Text>
              </View>

              <View style={[styles.syncInfoRow, tabletStyles.syncInfoRow, { borderColor: colors.borderLight }]}>
                <Text style={[styles.syncInfoLabel, tabletStyles.syncInfoLabel, { color: colors.textSecondary }]}>
                  クラウド同期
                </Text>
                <Text style={[styles.syncInfoValue, tabletStyles.syncInfoValue, { color: colors.textPrimary }]}>
                  {isPremium ? (
                    `${cloudSyncCount}冊（無制限）`
                  ) : (
                    `${cloudSyncCount} / ${cloudSyncLimit}冊`
                  )}
                </Text>
              </View>

              {!isPremium && cloudSyncCount >= cloudSyncLimit && (
                <View style={[styles.syncLimitWarning, tabletStyles.syncLimitWarning, { backgroundColor: colors.warning + '20' }]}>
                  <Text style={[styles.syncLimitWarningText, tabletStyles.syncLimitWarningText, { color: colors.warning }]}>
                    クラウド同期の上限に達しました。新しい本はローカルのみに保存されます。
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.syncButton, tabletStyles.syncButton, { backgroundColor: colors.primary }]}
                onPress={handleManualSync}
                disabled={isManualSyncing || syncState === 'syncing'}
                activeOpacity={0.7}
              >
                {isManualSyncing || syncState === 'syncing' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.syncButtonText, tabletStyles.syncButtonText]}>今すぐ同期</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signOutButton, tabletStyles.signOutButton, { borderColor: colors.border }]}
                onPress={handleSignOut}
                disabled={isSigningOut}
                activeOpacity={0.7}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Text style={[styles.signOutButtonText, tabletStyles.signOutButtonText, { color: colors.error }]}>
                    サインアウト
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.cloudSyncContent, tabletStyles.cloudSyncContent]}>
              <Text style={[styles.cloudSyncDescription, tabletStyles.cloudSyncDescription, { color: colors.textSecondary }]}>
                Appleでサインインすると、複数のデバイス間でデータを同期できます。
              </Text>

              <View style={[styles.cloudSyncFeatures, tabletStyles.cloudSyncFeatures]}>
                <Text style={[styles.cloudSyncFeature, tabletStyles.cloudSyncFeature, { color: colors.textTertiary }]}>
                  ・iPhone/iPad間でデータを同期
                </Text>
                <Text style={[styles.cloudSyncFeature, tabletStyles.cloudSyncFeature, { color: colors.textTertiary }]}>
                  ・デバイス紛失時のバックアップ
                </Text>
                <Text style={[styles.cloudSyncFeature, tabletStyles.cloudSyncFeature, { color: colors.textTertiary }]}>
                  ・機種変更時も簡単にデータ移行
                </Text>
              </View>

              {isAppleAuthAvailable ? (
                <View style={styles.appleButtonContainer}>
                  {isSigningIn ? (
                    <View style={[styles.appleButtonLoading, tabletStyles.appleButtonLoading, { backgroundColor: colors.textPrimary }]}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  ) : (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={isTablet ? 12 : 8}
                      style={[styles.appleButton, tabletStyles.appleButton]}
                      onPress={handleSignIn}
                    />
                  )}
                </View>
              ) : (
                <Text style={[styles.cloudSyncUnavailable, { color: colors.textTertiary }]}>
                  このデバイスではAppleサインインを利用できません
                </Text>
              )}

              <Text style={[styles.cloudSyncNote, tabletStyles.cloudSyncNote, { color: colors.textTertiary }]}>
                ※ サインインしなくてもアプリは使えます
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>データ管理</Text>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={handleExport}
          disabled={isExporting}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>📤</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>
              {isExporting ? 'エクスポート中...' : 'データをエクスポート'}
            </Text>
            <Text style={[styles.menuDescription, tabletStyles.menuDescription, themedStyles.menuDescription]}>
              JSONファイルとして保存・共有
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={handleImport}
          disabled={isImporting}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>📥</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>
              {isImporting ? 'インポート中...' : 'データをインポート'}
            </Text>
            <Text style={[styles.menuDescription, tabletStyles.menuDescription, themedStyles.menuDescription]}>
              JSONファイルから復元
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={handleDeleteAll}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>🗑️</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, { color: colors.error }]}>
              すべてのデータを削除
            </Text>
            <Text style={[styles.menuDescription, tabletStyles.menuDescription, themedStyles.menuDescription]}>
              登録した本をすべて削除します
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>アプリ情報</Text>

        <View style={[styles.infoRow, tabletStyles.infoRow, themedStyles.menuBorder]}>
          <Text style={[styles.infoLabel, tabletStyles.infoLabel, themedStyles.infoLabel]}>バージョン</Text>
          <Text style={[styles.infoValue, tabletStyles.infoValue, themedStyles.infoValue]}>1.4.0</Text>
        </View>

        <View style={[styles.infoRow, tabletStyles.infoRow, themedStyles.menuBorder]}>
          <Text style={[styles.infoLabel, tabletStyles.infoLabel, themedStyles.infoLabel]}>登録冊数</Text>
          <Text style={[styles.infoValue, tabletStyles.infoValue, themedStyles.infoValue]}>{books.length}冊</Text>
        </View>
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>法的情報</Text>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('TermsOfService')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>📋</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>利用規約</Text>
          </View>
          <Text style={[styles.menuArrow, tabletStyles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>🔒</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>プライバシーポリシー</Text>
          </View>
          <Text style={[styles.menuArrow, tabletStyles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('Licenses')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>📜</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>オープンソースライセンス</Text>
          </View>
          <Text style={[styles.menuArrow, tabletStyles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, tabletStyles.menuItem]}
          onPress={() => navigation.navigate('Disclaimer')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, tabletStyles.menuIcon, themedStyles.menuIcon]}>
            <Text style={[styles.menuIconText, tabletStyles.menuIconText]}>⚠️</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, tabletStyles.menuLabel, themedStyles.menuLabel]}>免責事項</Text>
          </View>
          <Text style={[styles.menuArrow, tabletStyles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, tabletStyles.footer, themedStyles.footer]}>
        積読本管理 v1.4.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  themeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 80,
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  presetSelector: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  presetOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  presetName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  presetDescription: {
    fontSize: 12,
  },
  currentDefinition: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  currentDefinitionTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {},
  statusIncluded: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statusExcluded: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
  cloudSyncLoading: {
    padding: 24,
    alignItems: 'center',
  },
  cloudSyncContent: {
    padding: 16,
  },
  cloudSyncDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cloudSyncFeatures: {
    marginBottom: 16,
  },
  cloudSyncFeature: {
    fontSize: 13,
    lineHeight: 22,
  },
  appleButtonContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appleButton: {
    width: 280,
    height: 44,
  },
  appleButtonLoading: {
    width: 280,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudSyncNote: {
    fontSize: 12,
    textAlign: 'center',
  },
  cloudSyncUnavailable: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  syncStatusIcon: {
    fontSize: 20,
    color: '#4CAF50',
    marginRight: 12,
  },
  syncStatusText: {
    flex: 1,
  },
  syncStatusTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  syncStatusEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  syncInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  syncInfoLabel: {
    fontSize: 14,
  },
  syncInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  syncLimitWarning: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  syncLimitWarningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
