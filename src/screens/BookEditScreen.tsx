import { useState, useEffect } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormInput, SelectInput, TagInput, DateInput } from '../components';
import { usePersistBook } from '../hooks';
import { useBookStore } from '../store';
import { BookStatus, Priority, BookCondition, RootStackParamList, RootStackNavigationProp } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, CONDITION_LABELS, CONDITION_COLORS } from '../constants';
import { useTheme } from '../contexts';
import { parsePrice } from '../utils';

type BookEditRouteProp = RouteProp<RootStackParamList, 'BookEdit'>;

interface FormData {
  title: string;
  authors: string;
  publisher: string;
  isbn: string;
  publishedDate: string;
  pageCount: string;
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

export default function BookEditScreen() {
  const route = useRoute<BookEditRouteProp>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { bookId } = route.params;
  const { getBookById } = useBookStore();
  const { updateBook } = usePersistBook();
  const { colors } = useTheme();

  const book = getBookById(bookId);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    authors: '',
    publisher: '',
    isbn: '',
    publishedDate: '',
    pageCount: '',
    status: 'unread',
    priority: 'medium',
    condition: 'new',
    purchaseDate: '',
    purchasePlace: '',
    purchasePrice: '',
    purchaseReason: '',
    tags: [],
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (book) {
      // ISO文字列からYYYY-MM-DD形式に変換
      const formatDateForInput = (isoString?: string): string => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        title: book.title,
        authors: book.authors.join(', '),
        publisher: book.publisher || '',
        isbn: book.isbn || '',
        publishedDate: book.publishedDate || '',
        pageCount: book.pageCount?.toString() || '',
        status: book.status,
        priority: book.priority,
        condition: book.condition || 'new',
        purchaseDate: formatDateForInput(book.purchaseDate),
        purchasePlace: book.purchasePlace || '',
        purchasePrice: book.purchasePrice?.toString() || '',
        purchaseReason: book.purchaseReason || '',
        tags: book.tags,
        notes: book.notes || '',
      });
    }
  }, [book]);

  const themedStyles = {
    container: { backgroundColor: colors.background },
    sectionTitle: { color: colors.textPrimary },
  };

  if (!book) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 40 }}>
          本が見つかりません
        </Text>
      </View>
    );
  }

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
      // YYYY-MM-DD形式をISO文字列に変換
      const parsePurchaseDate = (dateStr: string): string | undefined => {
        if (!dateStr.trim()) return undefined;
        const date = new Date(dateStr + 'T00:00:00');
        return date.toISOString();
      };

      await updateBook(bookId, {
        title: formData.title.trim(),
        authors: formData.authors.split(',').map(a => a.trim()).filter(Boolean),
        publisher: formData.publisher.trim() || undefined,
        isbn: formData.isbn.trim() || undefined,
        publishedDate: formData.publishedDate.trim() || undefined,
        pageCount: formData.pageCount ? Number(formData.pageCount) : undefined,
        status: formData.status,
        priority: formData.priority,
        condition: formData.condition,
        purchaseDate: parsePurchaseDate(formData.purchaseDate),
        purchasePlace: formData.purchasePlace.trim() || undefined,
        purchasePrice: parsePrice(formData.purchasePrice),
        purchaseReason: formData.purchaseReason.trim() || undefined,
        tags: formData.tags,
        notes: formData.notes.trim() || undefined,
      });

      Alert.alert('更新完了', `「${formData.title}」を更新しました`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('エラー', '更新に失敗しました');
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

        <DateInput
          label="出版日"
          value={formData.publishedDate}
          onChange={v => updateField('publishedDate', v)}
          placeholder="日付を選択"
        />

        <FormInput
          label="ページ数"
          value={formData.pageCount}
          onChangeText={v => updateField('pageCount', v)}
          placeholder="ページ数"
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
          placeholder="日付を選択"
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
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '更新中...' : '変更を保存する'}
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
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
