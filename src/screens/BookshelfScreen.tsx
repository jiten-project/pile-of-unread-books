import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BookCard, BookGridItem, EmptyState, FilterModal, FilterOptions } from '../components';
import { useBookStore } from '../store';
import { BookStatus, Book, AppNavigationProp } from '../types';
import { STATUS_LABELS, STATUS_COLORS, COLORS } from '../constants';
import { useTheme, useSettings } from '../contexts';

type FilterStatus = BookStatus | 'all';
type ViewMode = 'list' | 'grid';

// フィルターオプションの基本リスト（設定に応じて動的にフィルタリング）
const baseFilterOptions: { value: FilterStatus; label: string; optional?: 'wishlist' | 'released' }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'wishlist', label: STATUS_LABELS.wishlist, optional: 'wishlist' },
  { value: 'unread', label: STATUS_LABELS.unread },
  { value: 'reading', label: STATUS_LABELS.reading },
  { value: 'paused', label: STATUS_LABELS.paused },
  { value: 'completed', label: STATUS_LABELS.completed },
  { value: 'released', label: STATUS_LABELS.released, optional: 'released' },
];

const defaultFilters: FilterOptions = {
  statuses: [],
  priorities: [],
  tags: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function BookshelfScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>(defaultFilters);
  const { books } = useBookStore();
  const navigation = useNavigation<AppNavigationProp>();
  const { colors } = useTheme();
  const { showWishlistInBookshelf, showReleasedInBookshelf } = useSettings();

  // 設定がOFFになった場合、対応するフィルターをリセット
  useEffect(() => {
    if (!showWishlistInBookshelf && selectedFilter === 'wishlist') {
      setSelectedFilter('all');
    }
    if (!showReleasedInBookshelf && selectedFilter === 'released') {
      setSelectedFilter('all');
    }
  }, [showWishlistInBookshelf, showReleasedInBookshelf, selectedFilter]);

  // 利用可能なタグを抽出
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    books.forEach(book => book.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [books]);

  // 設定に応じてフィルターオプションを生成
  const filterOptions = useMemo(() => {
    return baseFilterOptions.filter(option => {
      if (option.optional === 'wishlist') return showWishlistInBookshelf;
      if (option.optional === 'released') return showReleasedInBookshelf;
      return true;
    });
  }, [showWishlistInBookshelf, showReleasedInBookshelf]);

  // アクティブなフィルター数を計算
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.statuses.length > 0) count++;
    if (advancedFilters.priorities.length > 0) count++;
    if (advancedFilters.tags.length > 0) count++;
    if (advancedFilters.sortBy !== 'createdAt' || advancedFilters.sortOrder !== 'desc') count++;
    return count;
  }, [advancedFilters]);

  const filteredBooks = useMemo(() => {
    let result = books;

    // クイックステータスフィルター
    if (selectedFilter !== 'all') {
      result = result.filter(book => book.status === selectedFilter);
    } else {
      // 「すべて」選択時に設定に応じて除外
      if (!showWishlistInBookshelf) {
        result = result.filter(book => book.status !== 'wishlist');
      }
      if (!showReleasedInBookshelf) {
        result = result.filter(book => book.status !== 'released');
      }
    }

    // 詳細フィルター - ステータス
    if (advancedFilters.statuses.length > 0) {
      result = result.filter(book => advancedFilters.statuses.includes(book.status));
    }

    // 詳細フィルター - 優先度
    if (advancedFilters.priorities.length > 0) {
      result = result.filter(book => advancedFilters.priorities.includes(book.priority));
    }

    // 詳細フィルター - タグ
    if (advancedFilters.tags.length > 0) {
      result = result.filter(book =>
        advancedFilters.tags.some(tag => book.tags.includes(tag))
      );
    }

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        book =>
          book.title.toLowerCase().includes(query) ||
          book.authors.some(author => author.toLowerCase().includes(query)) ||
          book.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // ソート
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (advancedFilters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'ja');
          break;
        case 'authors':
          comparison = (a.authors[0] || '').localeCompare(b.authors[0] || '', 'ja');
          break;
        case 'purchaseDate':
          comparison = (a.purchaseDate || '').localeCompare(b.purchaseDate || '');
          break;
        case 'tsundokuDays': {
          // 購入日（なければ登録日）からの経過日数でソート
          const dateA = new Date(a.purchaseDate || a.createdAt).getTime();
          const dateB = new Date(b.purchaseDate || b.createdAt).getTime();
          comparison = dateA - dateB;
          break;
        }
        case 'createdAt':
        default:
          comparison = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return advancedFilters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [books, selectedFilter, searchQuery, advancedFilters, showWishlistInBookshelf, showReleasedInBookshelf]);

  const handleBookPress = useCallback(
    (bookId: string) => {
      navigation.navigate('BookDetail', { bookId });
    },
    [navigation]
  );

  const getFilterColor = (filter: FilterStatus) => {
    if (filter === 'all') return COLORS.primary;
    return STATUS_COLORS[filter];
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setAdvancedFilters(filters);
    // 詳細フィルターでステータスを選択した場合、クイックフィルターをリセット
    if (filters.statuses.length > 0) {
      setSelectedFilter('all');
    }
  };

  const renderListItem = ({ item }: { item: Book }) => (
    <BookCard book={item} onPress={() => handleBookPress(item.id)} />
  );

  const renderGridItem = ({ item }: { item: Book }) => (
    <BookGridItem book={item} onPress={() => handleBookPress(item.id)} />
  );

  const themedStyles = {
    container: { backgroundColor: colors.background },
    searchContainer: { backgroundColor: colors.surface, borderBottomColor: colors.border },
    searchInputWrapper: { backgroundColor: colors.background },
    searchInput: { color: colors.textPrimary },
    filterContainer: { backgroundColor: colors.surface, borderBottomColor: colors.border },
    filterButton: { backgroundColor: colors.background, borderColor: colors.border },
    filterText: { color: colors.textSecondary },
    countText: { color: colors.textSecondary },
    viewButton: { backgroundColor: colors.border },
  };

  return (
    <View style={[styles.container, themedStyles.container]}>
      <View style={[styles.searchContainer, themedStyles.searchContainer]}>
        <View style={[styles.searchInputWrapper, themedStyles.searchInputWrapper]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, themedStyles.searchInput]}
            placeholder="タイトル、著者、タグで検索"
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearIcon, { color: colors.textTertiary }]}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.filterContainer, themedStyles.filterContainer]}>
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                themedStyles.filterButton,
                selectedFilter === item.value && {
                  backgroundColor: getFilterColor(item.value),
                  borderColor: getFilterColor(item.value),
                },
              ]}
              onPress={() => setSelectedFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  themedStyles.filterText,
                  selectedFilter === item.value && styles.filterTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={[
                styles.filterButton,
                themedStyles.filterButton,
                activeFilterCount > 0 && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Text
                style={[
                  styles.filterText,
                  themedStyles.filterText,
                  activeFilterCount > 0 && { color: colors.primary, fontWeight: '600' },
                ]}
              >
                詳細フィルター{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      <View style={styles.toolbar}>
        <Text style={[styles.countText, themedStyles.countText]}>{filteredBooks.length} 冊</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, themedStyles.viewButton, viewMode === 'list' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'list' && { color: '#fff' }]}>≡</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, themedStyles.viewButton, viewMode === 'grid' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[styles.viewButtonText, viewMode === 'grid' && { color: '#fff' }]}>⊞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredBooks.length === 0 ? (
        <EmptyState
          icon="📚"
          title={searchQuery ? '検索結果がありません' : '本がありません'}
          description={
            searchQuery
              ? '別のキーワードで検索してください'
              : selectedFilter === 'all'
                ? '最初の一冊を登録しましょう'
                : `${STATUS_LABELS[selectedFilter as BookStatus]}の本はありません`
          }
          actionLabel={!searchQuery && selectedFilter === 'all' ? '本を登録する' : undefined}
          onAction={!searchQuery && selectedFilter === 'all' ? () => navigation.navigate('AddBook') : undefined}
        />
      ) : viewMode === 'list' ? (
        <FlatList
          key="list-view"
          data={filteredBooks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderListItem}
        />
      ) : (
        <FlatList
          key="grid-view"
          data={filteredBooks}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderGridItem}
        />
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={advancedFilters}
        onApply={handleApplyFilters}
        availableTags={availableTags}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 20,
    paddingLeft: 8,
  },
  filterContainer: {
    borderBottomWidth: 1,
  },
  filterList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 14,
  },
  filterTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  countText: {
    fontSize: 14,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 20,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  gridContent: {
    padding: 16,
    paddingTop: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
});
