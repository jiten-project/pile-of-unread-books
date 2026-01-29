import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchByISBN } from '../services';
import { RootStackNavigationProp } from '../types';
import { useTheme } from '../contexts';
import { logError } from '../utils/logger';

export default function ISBNSearchScreen() {
  const [isbn, setIsbn] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useTheme();

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: colors.background },
      title: { color: colors.textPrimary },
      description: { color: colors.textSecondary },
      inputContainer: {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
      },
      input: { color: colors.textPrimary },
      clearButtonText: { color: colors.textTertiary },
      hint: { color: colors.textTertiary },
      searchButton: { backgroundColor: colors.primary },
      searchButtonDisabled: { backgroundColor: colors.disabled },
      scanButton: { borderColor: colors.primary },
      scanButtonText: { color: colors.primary },
    }),
    [colors]
  );

  const validateISBN = (value: string): boolean => {
    const clean = value.replace(/[-\s]/g, '');
    return clean.length === 10 || clean.length === 13;
  };

  const handleSearch = async () => {
    const cleanIsbn = isbn.replace(/[-\s]/g, '');

    if (!validateISBN(cleanIsbn)) {
      Alert.alert('エラー', 'ISBNは10桁または13桁で入力してください');
      return;
    }

    setIsSearching(true);

    try {
      const bookInfo = await searchByISBN(cleanIsbn);

      if (bookInfo) {
        navigation.navigate('BookConfirm', { bookInfo });
      } else {
        Alert.alert(
          '書籍が見つかりません',
          'この ISBN の書籍情報が見つかりませんでした。手動で登録しますか？',
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: '手動登録',
              onPress: () => {
                navigation.navigate('Main');
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('エラー', '書籍情報の取得に失敗しました');
      logError('isbnSearch', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatISBN = (value: string) => {
    const digits = value.replace(/[^\d]/g, '');
    return digits.slice(0, 13);
  };

  return (
    <View style={[styles.container, themedStyles.container]}>
      <View style={styles.content}>
        <Text style={[styles.title, themedStyles.title]}>ISBN で検索</Text>
        <Text style={[styles.description, themedStyles.description]}>
          本の裏表紙にあるISBN番号を入力してください
        </Text>

        <View style={[styles.inputContainer, themedStyles.inputContainer]}>
          <TextInput
            style={[styles.input, themedStyles.input]}
            value={isbn}
            onChangeText={v => setIsbn(formatISBN(v))}
            placeholder="9784000000000"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={13}
            autoFocus
            accessibilityLabel="ISBN入力欄"
          />
          {isbn.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setIsbn('')}
              accessibilityLabel="入力をクリア"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Text style={[styles.clearButtonText, themedStyles.clearButtonText]}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.hint, themedStyles.hint]}>
          ISBN-10（10桁）または ISBN-13（13桁）に対応
        </Text>

        <TouchableOpacity
          style={[
            styles.searchButton,
            themedStyles.searchButton,
            (!validateISBN(isbn) || isSearching) && themedStyles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!validateISBN(isbn) || isSearching}
          accessibilityLabel={isSearching ? '検索中' : 'ISBNで検索する'}
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>検索する</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, themedStyles.scanButton]}
          onPress={() => navigation.navigate('BarcodeScan')}
          accessibilityLabel="バーコードでスキャンする"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={[styles.scanButtonText, themedStyles.scanButtonText]}>
            バーコードでスキャン
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 16,
    letterSpacing: 2,
  },
  clearButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 24,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  searchButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 52,
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
