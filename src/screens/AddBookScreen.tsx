import { useState, useMemo } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FormInput, SelectInput, TagInput, DateInput } from '../components';
import { usePersistBook } from '../hooks';
import { BookStatus, Priority, BookCondition, RootStackNavigationProp } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, CONDITION_LABELS, CONDITION_COLORS } from '../constants';
import { useTheme } from '../contexts';
import { parsePrice } from '../utils';

interface FormData {
  title: string;
  authors: string;
  publisher: string;
  isbn: string;
  status: BookStatus;
  priority: Priority;
  condition: BookCondition;
  purchaseDate: string;
  purchasePlace: string;
  purchasePrice: string;
  purchaseReason: string;
  tags: string[];
  notes: string;
}

interface FormErrors {
  title?: string;
  authors?: string;
}

const initialFormData: FormData = {
  title: '',
  authors: '',
  publisher: '',
  isbn: '',
  status: 'unread',
  priority: 'medium',
  condition: 'new',
  purchaseDate: '',
  purchasePlace: '',
  purchasePrice: '',
  purchaseReason: '',
  tags: [],
  notes: '',
};

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as BookStatus,
  label,
  color: STATUS_COLORS[value as BookStatus],
}));

const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value: value as Priority,
  label,
  color: PRIORITY_COLORS[value as Priority],
}));

const conditionOptions = Object.entries(CONDITION_LABELS).map(([value, label]) => ({
  value: value as BookCondition,
  label,
  color: CONDITION_COLORS[value as BookCondition],
}));

export default function AddBookScreen() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addBook } = usePersistBook();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useTheme();

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: colors.background },
      quickActionButton: {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
      },
      quickActionText: { color: colors.primary },
      dividerLine: { backgroundColor: colors.border },
      dividerText: { color: colors.textTertiary },
      sectionTitle: { color: colors.textPrimary },
      submitButton: { backgroundColor: colors.primary },
      submitButtonDisabled: { backgroundColor: colors.disabled },
    }),
    [colors]
  );

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }
    if (!formData.authors.trim()) {
      newErrors.authors = '著者は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await addBook({
        title: formData.title.trim(),
        authors: formData.authors.split(',').map(a => a.trim()).filter(Boolean),
        publisher: formData.publisher.trim() || undefined,
        isbn: formData.isbn.trim() || undefined,
        status: formData.status,
        priority: formData.priority,
        condition: formData.condition,
        purchasePlace: formData.purchasePlace.trim() || undefined,
        purchasePrice: parsePrice(formData.purchasePrice),
        purchaseReason: formData.purchaseReason.trim() || undefined,
        purchaseDate: formData.purchaseDate
          ? new Date(formData.purchaseDate + 'T00:00:00').toISOString()
          : new Date().toISOString(),
        tags: formData.tags,
        notes: formData.notes.trim() || undefined,
      });

      Alert.alert('登録完了', `「${formData.title}」を登録しました`, [
        {
          text: 'OK',
          onPress: () => setFormData(initialFormData),
        },
      ]);
    } catch (error) {
      Alert.alert('エラー', '登録に失敗しました');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, themedStyles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, themedStyles.quickActionButton]}
            onPress={() => navigation.navigate('BarcodeScan')}
            accessibilityLabel="バーコードスキャンで本を追加"
            accessibilityRole="button"
          >
            <Text style={styles.quickActionIcon}>📷</Text>
            <Text style={[styles.quickActionText, themedStyles.quickActionText]}>
              バーコード{'\n'}スキャン
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, themedStyles.quickActionButton]}
            onPress={() => navigation.navigate('ISBNSearch')}
            accessibilityLabel="ISBN検索で本を追加"
            accessibilityRole="button"
          >
            <Text style={styles.quickActionIcon}>🔍</Text>
            <Text style={[styles.quickActionText, themedStyles.quickActionText]}>
              ISBN{'\n'}検索
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, themedStyles.dividerLine]} />
          <Text style={[styles.dividerText, themedStyles.dividerText]}>または手動で入力</Text>
          <View style={[styles.dividerLine, themedStyles.dividerLine]} />
        </View>

        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>基本情報</Text>

        <FormInput
          label="タイトル"
          required
          value={formData.title}
          onChangeText={v => updateField('title', v)}
          error={errors.title}
          placeholder="本のタイトルを入力"
        />

        <FormInput
          label="著者"
          required
          value={formData.authors}
          onChangeText={v => updateField('authors', v)}
          error={errors.authors}
          placeholder="著者名（複数の場合はカンマ区切り）"
        />

        <FormInput
          label="出版社"
          value={formData.publisher}
          onChangeText={v => updateField('publisher', v)}
          placeholder="出版社名"
        />

        <FormInput
          label="ISBN"
          value={formData.isbn}
          onChangeText={v => updateField('isbn', v)}
          placeholder="ISBN-13 または ISBN-10"
          keyboardType="numeric"
        />

        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>ステータス</Text>

        <SelectInput
          label="読書ステータス"
          options={statusOptions}
          value={formData.status}
          onChange={v => updateField('status', v)}
        />

        <SelectInput
          label="優先度"
          options={priorityOptions}
          value={formData.priority}
          onChange={v => updateField('priority', v)}
        />

        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>購入情報</Text>

        <SelectInput
          label="本の状態"
          options={conditionOptions}
          value={formData.condition}
          onChange={v => updateField('condition', v)}
        />

        <DateInput
          label="購入日"
          value={formData.purchaseDate}
          onChange={v => updateField('purchaseDate', v)}
          placeholder="購入日を選択"
        />

        <FormInput
          label="購入場所"
          value={formData.purchasePlace}
          onChangeText={v => updateField('purchasePlace', v)}
          placeholder="書店名、Amazon など"
        />

        <FormInput
          label="購入価格"
          value={formData.purchasePrice}
          onChangeText={v => updateField('purchasePrice', v)}
          placeholder="金額（円）"
          keyboardType="numeric"
        />

        <FormInput
          label="購入動機"
          value={formData.purchaseReason}
          onChangeText={v => updateField('purchaseReason', v)}
          placeholder="なぜこの本を買ったか"
          multiline
          numberOfLines={2}
          style={styles.textArea}
        />

        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>分類・メモ</Text>

        <TagInput
          label="タグ"
          tags={formData.tags}
          onChange={tags => updateField('tags', tags)}
        />

        <FormInput
          label="メモ"
          value={formData.notes}
          onChangeText={v => updateField('notes', v)}
          placeholder="自由にメモを記入"
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            themedStyles.submitButton,
            isSubmitting && themedStyles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityLabel={isSubmitting ? '登録中' : '本を登録する'}
          accessibilityRole="button"
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '積読を増やし中...' : 'また積読が増える...'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 52,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
