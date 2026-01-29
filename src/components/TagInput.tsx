import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts';
import { DEVICE } from '../constants';

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ label, tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const { colors } = useTheme();

  // iPad用の拡大スタイル
  const tabletStyles = DEVICE.isTablet ? {
    container: { marginBottom: 20 },
    label: { fontSize: 18, marginBottom: 10 },
    inputRow: { gap: 12 },
    input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, borderRadius: 12 },
    addButton: { paddingHorizontal: 24, borderRadius: 12 },
    addButtonText: { fontSize: 18 },
    tagsContainer: { gap: 12, marginTop: 12 },
    tag: { paddingLeft: 16, paddingRight: 8, paddingVertical: 10, borderRadius: 24, minHeight: 48 },
    tagText: { fontSize: 18 },
    removeButton: { marginLeft: 10, width: 32, height: 32, borderRadius: 16 },
    removeButtonText: { fontSize: 20 },
  } : {};

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <View style={[styles.container, tabletStyles.container]}>
      <Text style={[styles.label, { color: colors.textPrimary }, tabletStyles.label]}>{label}</Text>
      <View style={[styles.inputRow, tabletStyles.inputRow]}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            },
            tabletStyles.input,
          ]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="タグを入力"
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={addTag}
          returnKeyType="done"
          accessibilityLabel="タグ入力欄"
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }, tabletStyles.addButton]}
          onPress={addTag}
          accessibilityLabel="タグを追加"
          accessibilityRole="button"
        >
          <Text style={[styles.addButtonText, tabletStyles.addButtonText]}>追加</Text>
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View style={[styles.tagsContainer, tabletStyles.tagsContainer]}>
          {tags.map(tag => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.primaryLight }, tabletStyles.tag]}
            >
              <Text style={[styles.tagText, { color: colors.primary }, tabletStyles.tagText]}>{tag}</Text>
              <TouchableOpacity
                onPress={() => removeTag(tag)}
                style={[styles.removeButton, { backgroundColor: colors.primary }, tabletStyles.removeButton]}
                accessibilityLabel={`${tag}を削除`}
                accessibilityRole="button"
              >
                <Text style={[styles.removeButtonText, tabletStyles.removeButtonText]}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    minHeight: 36,
  },
  tagText: {
    fontSize: 14,
  },
  removeButton: {
    marginLeft: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
});
