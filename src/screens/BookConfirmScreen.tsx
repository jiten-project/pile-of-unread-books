import { useState, useMemo } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FormInput, SelectInput, TagInput } from '../components';
import { usePersistBook } from '../hooks';
import { BookStatus, Priority, BookCondition, RootStackNavigationProp, BookConfirmRouteProp } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, CONDITION_LABELS, CONDITION_COLORS } from '../constants';
import { useTheme } from '../contexts';

interface AdditionalData {
  status: BookStatus;
  priority: Priority;
  condition: BookCondition;
  purchasePlace: string;
  purchasePrice: string;
  purchaseReason: string;
  tags: string[];
  notes: string;
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

export default function BookConfirmScreen() {
  const route = useRoute<BookConfirmRouteProp>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { bookInfo } = route.params;
  const { addBook } = usePersistBook();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { colors } = useTheme();

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: colors.background },
      bookInfoCard: { backgroundColor: colors.surface },
      title: { color: colors.textPrimary },
      authors: { color: colors.textSecondary },
      publisher: { color: colors.textTertiary },
      isbn: { color: colors.textTertiary },
      borderColor: { borderTopColor: colors.borderLight },
      descriptionLabel: { color: colors.textSecondary },
      description: { color: colors.textPrimary },
      metaLabel: { color: colors.textSecondary },
      metaValue: { color: colors.textPrimary },
      sectionTitle: { color: colors.textPrimary },
      submitButton: { backgroundColor: colors.primary },
      submitButtonDisabled: { backgroundColor: colors.disabled },
      noImage: { backgroundColor: colors.border },
      noImageText: { color: colors.textTertiary },
    }),
    [colors]
  );

  const [additionalData, setAdditionalData] = useState<AdditionalData>({
    status: 'unread',
    priority: 'medium',
    condition: 'new',
    purchasePlace: '',
    purchasePrice: '',
    purchaseReason: '',
    tags: [],
    notes: '',
  });

  const updateField = <K extends keyof AdditionalData>(field: K, value: AdditionalData[K]) => {
    setAdditionalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addBook({
        ...bookInfo,
        status: additionalData.status,
        priority: additionalData.priority,
        condition: additionalData.condition,
        purchasePlace: additionalData.purchasePlace.trim() || undefined,
        purchasePrice: additionalData.purchasePrice
          ? Number(additionalData.purchasePrice)
          : undefined,
        purchaseReason: additionalData.purchaseReason.trim() || undefined,
        purchaseDate: new Date().toISOString(),
        tags: additionalData.tags,
        notes: additionalData.notes.trim() || undefined,
      });

      Alert.alert('登録完了', `「${bookInfo.title}」を登録しました`, [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Main');
          },
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
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.bookInfoCard, themedStyles.bookInfoCard]}>
        <View style={styles.bookHeader}>
          {bookInfo.thumbnailUrl ? (
            <Image source={{ uri: bookInfo.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.noImage, themedStyles.noImage]}>
              <Text style={[styles.noImageText, themedStyles.noImageText]}>No Image</Text>
            </View>
          )}
          <View style={styles.bookDetails}>
            <Text style={[styles.title, themedStyles.title]}>{bookInfo.title}</Text>
            <Text style={[styles.authors, themedStyles.authors]}>
              {bookInfo.authors.join(', ')}
            </Text>
            {bookInfo.publisher && (
              <Text style={[styles.publisher, themedStyles.publisher]}>{bookInfo.publisher}</Text>
            )}
            {bookInfo.isbn && (
              <Text style={[styles.isbn, themedStyles.isbn]}>ISBN: {bookInfo.isbn}</Text>
            )}
          </View>
        </View>

        {bookInfo.description && (
          <View style={[styles.descriptionContainer, themedStyles.borderColor]}>
            <Text style={[styles.descriptionLabel, themedStyles.descriptionLabel]}>概要</Text>
            <Text style={[styles.description, themedStyles.description]} numberOfLines={4}>
              {bookInfo.description}
            </Text>
          </View>
        )}

        <View style={[styles.metaRow, themedStyles.borderColor]}>
          {bookInfo.pageCount && (
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, themedStyles.metaLabel]}>ページ数</Text>
              <Text style={[styles.metaValue, themedStyles.metaValue]}>
                {bookInfo.pageCount}ページ
              </Text>
            </View>
          )}
          {bookInfo.publishedDate && (
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, themedStyles.metaLabel]}>発売日</Text>
              <Text style={[styles.metaValue, themedStyles.metaValue]}>
                {bookInfo.publishedDate}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>登録情報</Text>

      <SelectInput
        label="読書ステータス"
        options={statusOptions}
        value={additionalData.status}
        onChange={v => updateField('status', v)}
      />

      <SelectInput
        label="優先度"
        options={priorityOptions}
        value={additionalData.priority}
        onChange={v => updateField('priority', v)}
      />

      <SelectInput
        label="本の状態"
        options={conditionOptions}
        value={additionalData.condition}
        onChange={v => updateField('condition', v)}
      />

      <FormInput
        label="購入場所"
        value={additionalData.purchasePlace}
        onChangeText={v => updateField('purchasePlace', v)}
        placeholder="書店名、Amazon など"
      />

      <FormInput
        label="購入価格"
        value={additionalData.purchasePrice}
        onChangeText={v => updateField('purchasePrice', v)}
        placeholder="金額（円）"
        keyboardType="numeric"
      />

      <FormInput
        label="購入動機"
        value={additionalData.purchaseReason}
        onChangeText={v => updateField('purchaseReason', v)}
        placeholder="なぜこの本を買ったか"
        multiline
        numberOfLines={2}
        style={styles.textArea}
      />

      <TagInput
        label="タグ"
        tags={additionalData.tags}
        onChange={tags => updateField('tags', tags)}
      />

      <FormInput
        label="メモ"
        value={additionalData.notes}
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
          {isSubmitting ? '積読を増やし中...' : 'また買っちゃった...'}
        </Text>
      </TouchableOpacity>
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
  bookInfoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookHeader: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 6,
  },
  noImage: {
    width: 80,
    height: 120,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 10,
  },
  bookDetails: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  authors: {
    fontSize: 14,
    marginBottom: 4,
  },
  publisher: {
    fontSize: 12,
    marginBottom: 2,
  },
  isbn: {
    fontSize: 12,
  },
  descriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  descriptionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 24,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 12,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
