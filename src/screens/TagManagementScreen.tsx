import { useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBookStore } from '../store';
import { usePersistBook } from '../hooks';
import { useTheme } from '../contexts';

interface TagInfo {
  name: string;
  count: number;
}

export default function TagManagementScreen() {
  const { books } = useBookStore();
  const { updateBook } = usePersistBook();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');

  // タグとその使用回数を集計
  const tagInfoList = useMemo(() => {
    const tagMap = new Map<string, number>();
    books.forEach(book => {
      book.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });

    const list: TagInfo[] = Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return list.filter(tag => tag.name.toLowerCase().includes(query));
    }

    return list;
  }, [books, searchQuery]);

  const handleDeleteTag = (tagName: string, bookCount: number) => {
    Alert.alert(
      'タグを削除',
      `「${tagName}」を${bookCount}冊の本から削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            // 該当するタグを持つすべての本からタグを削除
            const booksWithTag = books.filter(book => book.tags.includes(tagName));
            for (const book of booksWithTag) {
              await updateBook(book.id, {
                tags: book.tags.filter(t => t !== tagName),
              });
            }
            Alert.alert('完了', `「${tagName}」を削除しました`);
          },
        },
      ]
    );
  };

  const openRenameModal = (tagName: string) => {
    setEditingTag(tagName);
    setNewTagName(tagName);
    setRenameModalVisible(true);
  };

  const closeRenameModal = () => {
    setRenameModalVisible(false);
    setEditingTag(null);
    setNewTagName('');
  };

  const handleRenameTag = async () => {
    if (!editingTag || !newTagName.trim() || newTagName.trim() === editingTag) {
      closeRenameModal();
      return;
    }

    const trimmedName = newTagName.trim();

    // 既存のタグ名と重複チェック
    const existingTags = new Set<string>();
    books.forEach(book => book.tags.forEach(tag => existingTags.add(tag)));
    if (existingTags.has(trimmedName)) {
      Alert.alert('エラー', 'そのタグ名は既に存在します');
      return;
    }

    // 該当するタグを持つすべての本のタグを更新
    const booksWithTag = books.filter(book => book.tags.includes(editingTag));
    for (const book of booksWithTag) {
      await updateBook(book.id, {
        tags: book.tags.map(t => (t === editingTag ? trimmedName : t)),
      });
    }

    closeRenameModal();
    Alert.alert('完了', `「${editingTag}」を「${trimmedName}」に変更しました`);
  };

  const themedStyles = {
    container: { backgroundColor: colors.background },
    header: { backgroundColor: colors.surface, borderBottomColor: colors.border },
    searchInputWrapper: { backgroundColor: colors.background },
    searchInput: { color: colors.textPrimary },
    tagItem: { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
    tagName: { color: colors.textPrimary },
    tagCount: { color: colors.textSecondary },
    actionButton: { backgroundColor: colors.background },
    actionText: { color: colors.textSecondary },
    deleteText: { color: colors.error },
    emptyText: { color: colors.textTertiary },
    modalContent: { backgroundColor: colors.surface },
    modalTitle: { color: colors.textPrimary },
    modalInput: { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border },
  };

  const renderTagItem = ({ item }: { item: TagInfo }) => (
    <View style={[styles.tagItem, themedStyles.tagItem]}>
      <View style={styles.tagInfo}>
        <View style={[styles.tagBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.tagName, { color: colors.primary }]}>{item.name}</Text>
        </View>
        <Text style={[styles.tagCount, themedStyles.tagCount]}>{item.count}冊</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, themedStyles.actionButton]}
          onPress={() => openRenameModal(item.name)}
        >
          <Text style={[styles.actionText, themedStyles.actionText]}>名前変更</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, themedStyles.actionButton]}
          onPress={() => handleDeleteTag(item.name, item.count)}
        >
          <Text style={[styles.actionText, themedStyles.deleteText]}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, themedStyles.container]}>
      <View style={[styles.header, themedStyles.header]}>
        <View style={[styles.searchInputWrapper, themedStyles.searchInputWrapper]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, themedStyles.searchInput]}
            placeholder="タグを検索"
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
        <Text style={[styles.totalCount, { color: colors.textSecondary }]}>
          {tagInfoList.length} タグ
        </Text>
      </View>

      {tagInfoList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏷️</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {searchQuery ? '検索結果がありません' : 'タグがありません'}
          </Text>
          <Text style={[styles.emptyDescription, themedStyles.emptyText]}>
            {searchQuery
              ? '別のキーワードで検索してください'
              : '本にタグを追加すると、ここに表示されます'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tagInfoList}
          keyExtractor={item => item.name}
          renderItem={renderTagItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={renameModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeRenameModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themedStyles.modalContent]}>
            <Text style={[styles.modalTitle, themedStyles.modalTitle]}>タグ名を変更</Text>
            <TextInput
              style={[styles.modalInput, themedStyles.modalInput]}
              value={newTagName}
              onChangeText={setNewTagName}
              placeholder="新しいタグ名"
              placeholderTextColor={colors.placeholder}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={closeRenameModal}
              >
                <Text style={{ color: colors.textSecondary }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleRenameTag}
              >
                <Text style={styles.modalButtonPrimaryText}>変更</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
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
  totalCount: {
    fontSize: 14,
    textAlign: 'right',
  },
  listContent: {
    paddingBottom: 20,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagCount: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonPrimary: {
    borderWidth: 0,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
