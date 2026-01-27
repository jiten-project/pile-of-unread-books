import { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BookStatus, Priority } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../constants';
import { useTheme } from '../contexts';

export interface FilterOptions {
  statuses: BookStatus[];
  priorities: Priority[];
  tags: string[];
  sortBy: 'createdAt' | 'title' | 'authors' | 'purchaseDate' | 'tsundokuDays';
  sortOrder: 'asc' | 'desc';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
  availableTags: string[];
}

const SORT_OPTIONS: { value: FilterOptions['sortBy']; label: string }[] = [
  { value: 'createdAt', label: '登録日' },
  { value: 'title', label: 'タイトル' },
  { value: 'authors', label: '著者' },
  { value: 'purchaseDate', label: '購入日' },
  { value: 'tsundokuDays', label: '積読期間' },
];

export default function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
  availableTags,
}: FilterModalProps) {
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  // モーダルが開かれたときにpropsのfiltersと同期
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleStatusToggle = (status: BookStatus) => {
    setLocalFilters(prev => {
      const statuses = prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status];
      return { ...prev, statuses };
    });
  };

  const handlePriorityToggle = (priority: Priority) => {
    setLocalFilters(prev => {
      const priorities = prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority];
      return { ...prev, priorities };
    });
  };

  const handleTagToggle = (tag: string) => {
    setLocalFilters(prev => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  const handleSortByChange = (sortBy: FilterOptions['sortBy']) => {
    setLocalFilters(prev => ({ ...prev, sortBy }));
  };

  const handleSortOrderToggle = () => {
    setLocalFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleReset = () => {
    setLocalFilters({
      statuses: [],
      priorities: [],
      tags: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const themedStyles = {
    overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
    container: { backgroundColor: colors.surface },
    header: { borderBottomColor: colors.borderLight },
    title: { color: colors.textPrimary },
    resetButton: { color: colors.primary },
    sectionTitle: { color: colors.textPrimary },
    chip: { backgroundColor: colors.background, borderColor: colors.border },
    chipText: { color: colors.textSecondary },
    chipSelected: { borderColor: colors.primary },
    chipSelectedText: { color: colors.primary },
    sortButton: { backgroundColor: colors.background, borderColor: colors.border },
    sortButtonText: { color: colors.textSecondary },
    sortButtonSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    sortButtonSelectedText: { color: colors.primary },
    footer: { borderTopColor: colors.borderLight },
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, themedStyles.overlay]}>
        <View style={[styles.container, themedStyles.container]}>
          <View style={[styles.header, themedStyles.header]}>
            <Text style={[styles.title, themedStyles.title]}>フィルター</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.resetButton, themedStyles.resetButton]}>リセット</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>ステータス</Text>
              <View style={styles.chipContainer}>
                {(Object.keys(STATUS_LABELS) as BookStatus[]).map(status => {
                  const isSelected = localFilters.statuses.includes(status);
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.chip,
                        themedStyles.chip,
                        isSelected && { backgroundColor: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] },
                      ]}
                      onPress={() => handleStatusToggle(status)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          themedStyles.chipText,
                          isSelected && [styles.chipTextSelected, { color: colors.textOnPrimary }],
                        ]}
                      >
                        {STATUS_LABELS[status]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>優先度</Text>
              <View style={styles.chipContainer}>
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map(priority => {
                  const isSelected = localFilters.priorities.includes(priority);
                  return (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.chip,
                        themedStyles.chip,
                        isSelected && { backgroundColor: PRIORITY_COLORS[priority], borderColor: PRIORITY_COLORS[priority] },
                      ]}
                      onPress={() => handlePriorityToggle(priority)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          themedStyles.chipText,
                          isSelected && [styles.chipTextSelected, { color: colors.textOnPrimary }],
                        ]}
                      >
                        {PRIORITY_LABELS[priority]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {availableTags.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>タグ</Text>
                <View style={styles.chipContainer}>
                  {availableTags.map(tag => {
                    const isSelected = localFilters.tags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.chip,
                          themedStyles.chip,
                          isSelected && themedStyles.chipSelected,
                        ]}
                        onPress={() => handleTagToggle(tag)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            themedStyles.chipText,
                            isSelected && themedStyles.chipSelectedText,
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>並び替え</Text>
              <View style={styles.sortContainer}>
                {SORT_OPTIONS.map(option => {
                  const isSelected = localFilters.sortBy === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortButton,
                        themedStyles.sortButton,
                        isSelected && themedStyles.sortButtonSelected,
                      ]}
                      onPress={() => handleSortByChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.sortButtonText,
                          themedStyles.sortButtonText,
                          isSelected && themedStyles.sortButtonSelectedText,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.orderToggle, { backgroundColor: colors.background }]}
                onPress={handleSortOrderToggle}
              >
                <Text style={{ color: colors.textSecondary }}>
                  {localFilters.sortOrder === 'desc' ? '降順 ↓' : '昇順 ↑'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={[styles.footer, themedStyles.footer]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.textSecondary }}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.applyButtonText, { color: colors.textOnPrimary }]}>適用</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 14,
  },
  orderToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
