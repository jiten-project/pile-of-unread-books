import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchBooks } from '../services';
import { BookInfo, RootStackNavigationProp } from '../types';
import { useTheme } from '../contexts';
import { logError } from '../utils/logger';

export default function TitleSearchScreen() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<BookInfo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useTheme();

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: colors.background },
      title: { color: colors.textPrimary },
      description: { color: colors.textSecondary },
      inputContainer: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
      inputContainerFocused: {
        borderColor: colors.primary,
      },
      input: { color: colors.textPrimary },
      inputLabel: { color: colors.textSecondary },
      searchButton: { backgroundColor: colors.primary },
      searchButtonDisabled: { backgroundColor: colors.disabled },
      resultItem: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
      resultTitle: { color: colors.textPrimary },
      resultAuthor: { color: colors.textSecondary },
      resultPublisher: { color: colors.textTertiary },
      emptyText: { color: colors.textTertiary },
    }),
    [colors]
  );

  const hasQuery = title.trim().length > 0 || author.trim().length > 0 || publisher.trim().length > 0;

  const handleSearch = async () => {
    if (!hasQuery) {
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const books = await searchBooks({
        title: title.trim() || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
      });
      setResults(books);
    } catch (error) {
      logError('titleSearch', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (bookInfo: BookInfo) => {
    navigation.navigate('BookConfirm', { bookInfo });
  };

  const handleClear = () => {
    setTitle('');
    setAuthor('');
    setPublisher('');
    setResults([]);
    setHasSearched(false);
  };

  const renderResultItem = ({ item }: { item: BookInfo }) => (
    <TouchableOpacity
      style={[styles.resultItem, themedStyles.resultItem]}
      onPress={() => handleSelectBook(item)}
      accessibilityLabel={`${item.title}を選択`}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.noThumbnail]}>
          <Text style={styles.noThumbnailText}>📚</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, themedStyles.resultTitle]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.resultAuthor, themedStyles.resultAuthor]} numberOfLines={1}>
          {item.authors?.join(', ') || '著者不明'}
        </Text>
        {item.publisher && (
          <Text style={[styles.resultPublisher, themedStyles.resultPublisher]} numberOfLines={1}>
            {item.publisher}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (!hasSearched) return null;
    if (isSearching) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, themedStyles.emptyText]}>
          検索結果がありませんでした
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, themedStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, themedStyles.title]}>書籍を検索</Text>
        <Text style={[styles.description, themedStyles.description]}>
          タイトル・著者・出版社で検索できます
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>タイトル</Text>
          <View style={[styles.inputContainer, themedStyles.inputContainer]}>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={title}
              onChangeText={setTitle}
              placeholder="本のタイトル"
              placeholderTextColor={colors.placeholder}
              returnKeyType="next"
              accessibilityLabel="タイトル入力欄"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>著者</Text>
          <View style={[styles.inputContainer, themedStyles.inputContainer]}>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={author}
              onChangeText={setAuthor}
              placeholder="著者名"
              placeholderTextColor={colors.placeholder}
              returnKeyType="next"
              accessibilityLabel="著者入力欄"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>出版社</Text>
          <View style={[styles.inputContainer, themedStyles.inputContainer]}>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={publisher}
              onChangeText={setPublisher}
              placeholder="出版社名"
              placeholderTextColor={colors.placeholder}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              accessibilityLabel="出版社入力欄"
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.searchButton,
              themedStyles.searchButton,
              (!hasQuery || isSearching) && themedStyles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={!hasQuery || isSearching}
            accessibilityLabel={isSearching ? '検索中' : '検索する'}
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>検索</Text>
            )}
          </TouchableOpacity>

          {hasQuery && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              accessibilityLabel="クリア"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>クリア</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item, index) => item.isbn || `result-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 10,
    borderWidth: 1,
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  searchButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  thumbnail: {
    width: 50,
    height: 75,
    borderRadius: 4,
    marginRight: 12,
  },
  noThumbnail: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noThumbnailText: {
    fontSize: 20,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultAuthor: {
    fontSize: 13,
    marginBottom: 2,
  },
  resultPublisher: {
    fontSize: 11,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
