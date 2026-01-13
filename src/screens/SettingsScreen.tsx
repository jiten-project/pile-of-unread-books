import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBookStore } from '../store';
import { exportBooks, importBooks } from '../services';
import { insertBook, getAllBooks, deleteAllBooks } from '../services/database';
import { AppNavigationProp } from '../types';
import { useTheme, ThemeMode, useSettings, TSUNDOKU_PRESETS, TsundokuPresetKey } from '../contexts';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'system', label: 'システム設定', icon: '📱' },
  { value: 'light', label: 'ライト', icon: '☀️' },
  { value: 'dark', label: 'ダーク', icon: '🌙' },
];

export default function SettingsScreen() {
  const { books, setBooks } = useBookStore();
  const navigation = useNavigation<AppNavigationProp>();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { tsundokuDefinition, setTsundokuDefinition, currentPreset } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handlePresetSelect = (presetKey: TsundokuPresetKey) => {
    setTsundokuDefinition(TSUNDOKU_PRESETS[presetKey].definition);
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
      console.error(error);
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

              // インポート処理
              let addedCount = 0;
              let updatedCount = 0;

              for (const book of importedBooks) {
                if (existingIds.has(book.id)) {
                  updatedCount++;
                } else {
                  addedCount++;
                }
                await insertBook(book);
              }

              // ストアを更新
              const allBooks = await getAllBooks();
              setBooks(allBooks);

              Alert.alert(
                'インポート完了',
                `${addedCount}冊を追加、${updatedCount}冊を更新しました`
              );
            } catch (error) {
              Alert.alert('エラー', 'データのインポートに失敗しました');
              console.error(error);
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    if (books.length === 0) {
      Alert.alert('削除', '削除するデータがありません');
      return;
    }

    Alert.alert(
      'すべてのデータを削除',
      `本当に${books.length}冊のデータをすべて削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              // データベースから全削除
              await deleteAllBooks();
              // メモリ上のストアもクリア
              setBooks([]);
              Alert.alert('完了', 'すべてのデータを削除しました');
            } catch (error) {
              Alert.alert('エラー', 'データの削除に失敗しました');
              console.error(error);
            }
          },
        },
      ]
    );
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

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>外観</Text>

        <View style={styles.themeSelector}>
          {THEME_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                themeMode === option.value
                  ? themedStyles.themeActive
                  : themedStyles.themeInactive,
              ]}
              onPress={() => setThemeMode(option.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.themeIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.themeLabel,
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

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>積読の定義</Text>
        <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
          あなたにとっての「積読」とは？
        </Text>

        <View style={styles.presetSelector}>
          {(Object.entries(TSUNDOKU_PRESETS) as [TsundokuPresetKey, typeof TSUNDOKU_PRESETS[TsundokuPresetKey]][]).map(
            ([key, preset]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.presetOption,
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

        <View style={[styles.currentDefinition, { backgroundColor: colors.background }]}>
          <Text style={[styles.currentDefinitionTitle, { color: colors.textSecondary }]}>
            現在の設定:
          </Text>
          <View style={styles.statusList}>
            <View style={styles.statusItem}>
              <Text style={tsundokuDefinition.includeUnread ? styles.statusIncluded : [styles.statusExcluded, { color: colors.textTertiary }]}>
                {tsundokuDefinition.includeUnread ? '✓' : '−'} 未読
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={tsundokuDefinition.includeReading ? styles.statusIncluded : [styles.statusExcluded, { color: colors.textTertiary }]}>
                {tsundokuDefinition.includeReading ? '✓' : '−'} 読書中
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={tsundokuDefinition.includePaused ? styles.statusIncluded : [styles.statusExcluded, { color: colors.textTertiary }]}>
                {tsundokuDefinition.includePaused ? '✓' : '−'} 中断
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusExcluded, { color: colors.textTertiary }]}>
                − 読了
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>通知</Text>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('NotificationSettings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>🔔</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>通知設定</Text>
            <Text style={[styles.menuDescription, themedStyles.menuDescription]}>
              読書リマインダーの設定
            </Text>
          </View>
          <Text style={[styles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>コンテンツ管理</Text>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('TagManagement')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>🏷️</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>タグ管理</Text>
            <Text style={[styles.menuDescription, themedStyles.menuDescription]}>
              タグの編集・削除
            </Text>
          </View>
          <Text style={[styles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>データ管理</Text>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={handleExport}
          disabled={isExporting}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>📤</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>
              {isExporting ? 'エクスポート中...' : 'データをエクスポート'}
            </Text>
            <Text style={[styles.menuDescription, themedStyles.menuDescription]}>
              JSONファイルとして保存・共有
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={handleImport}
          disabled={isImporting}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>📥</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>
              {isImporting ? 'インポート中...' : 'データをインポート'}
            </Text>
            <Text style={[styles.menuDescription, themedStyles.menuDescription]}>
              JSONファイルから復元
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={handleDeleteAll}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>🗑️</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, { color: colors.error }]}>
              すべてのデータを削除
            </Text>
            <Text style={[styles.menuDescription, themedStyles.menuDescription]}>
              登録した本をすべて削除します
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>アプリ情報</Text>

        <View style={[styles.infoRow, themedStyles.menuBorder]}>
          <Text style={[styles.infoLabel, themedStyles.infoLabel]}>バージョン</Text>
          <Text style={[styles.infoValue, themedStyles.infoValue]}>1.0.0</Text>
        </View>

        <View style={[styles.infoRow, themedStyles.menuBorder]}>
          <Text style={[styles.infoLabel, themedStyles.infoLabel]}>登録冊数</Text>
          <Text style={[styles.infoValue, themedStyles.infoValue]}>{books.length}冊</Text>
        </View>
      </View>

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>法的情報</Text>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('TermsOfService')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>📋</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>利用規約</Text>
          </View>
          <Text style={[styles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>🔒</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>プライバシーポリシー</Text>
          </View>
          <Text style={[styles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, themedStyles.menuBorder]}
          onPress={() => navigation.navigate('Licenses')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>📜</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>オープンソースライセンス</Text>
          </View>
          <Text style={[styles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Disclaimer')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, themedStyles.menuIcon]}>
            <Text style={styles.menuIconText}>⚠️</Text>
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, themedStyles.menuLabel]}>免責事項</Text>
          </View>
          <Text style={[styles.menuArrow, themedStyles.menuArrow]}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, themedStyles.footer]}>
        積読本管理 v1.0.0
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
});
