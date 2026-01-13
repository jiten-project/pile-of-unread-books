import { useState } from 'react';
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
import { useBookStore } from '../store';
import { usePersistBook } from '../hooks';
import { BookStatus, RootStackNavigationProp, BookDetailRouteProp } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, CONDITION_LABELS, CONDITION_COLORS } from '../constants';
import { formatDate, formatPrice, joinWithComma } from '../utils';
import { useTheme } from '../contexts';

export default function BookDetailScreen() {
  const route = useRoute<BookDetailRouteProp>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { bookId } = route.params;
  const { getBookById } = useBookStore();
  const { updateStatus, deleteBook } = usePersistBook();
  const { colors } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const book = getBookById(bookId);

  const themedStyles = {
    container: { backgroundColor: colors.background },
    errorText: { color: colors.textTertiary },
    header: { backgroundColor: colors.surface },
    title: { color: colors.textPrimary },
    authors: { color: colors.textSecondary },
    publisher: { color: colors.textTertiary },
    section: { backgroundColor: colors.surface },
    sectionTitle: { color: colors.textPrimary },
    statusButton: { backgroundColor: colors.background, borderColor: colors.border },
    statusButtonText: { color: colors.textSecondary },
    infoLabel: { color: colors.textSecondary },
    infoValue: { color: colors.textPrimary },
    infoBorder: { borderBottomColor: colors.borderLight },
    subLabel: { color: colors.textSecondary },
    noteText: { color: colors.textPrimary },
    placeholderImage: { backgroundColor: colors.border },
    placeholderText: { color: colors.textTertiary },
  };

  if (!book) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <Text style={[styles.errorText, themedStyles.errorText]}>本が見つかりません</Text>
      </View>
    );
  }

  const handleStatusChange = async (newStatus: BookStatus) => {
    await updateStatus(book.id, newStatus);
  };

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      `「${book.title}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteBook(book.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('エラー', '削除に失敗しました');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.header, themedStyles.header]}>
        <View style={styles.imageContainer}>
          {book.thumbnailUrl ? (
            <Image source={{ uri: book.thumbnailUrl }} style={styles.image} />
          ) : (
            <View style={[styles.placeholderImage, themedStyles.placeholderImage]}>
              <Text style={[styles.placeholderText, themedStyles.placeholderText]}>No Image</Text>
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.title, themedStyles.title]}>{book.title}</Text>
          <Text style={[styles.authors, themedStyles.authors]}>{joinWithComma(book.authors)}</Text>
          {book.publisher && (
            <Text style={[styles.publisher, themedStyles.publisher]}>{book.publisher}</Text>
          )}

          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[book.status] }]}>
              <Text style={styles.badgeText}>{STATUS_LABELS[book.status]}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[book.priority] }]}>
              <Text style={styles.badgeText}>優先度: {PRIORITY_LABELS[book.priority]}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>ステータス変更</Text>
        <View style={styles.statusButtons}>
          {(Object.keys(STATUS_LABELS) as BookStatus[]).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                themedStyles.statusButton,
                book.status === status && { backgroundColor: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] },
              ]}
              onPress={() => handleStatusChange(status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  themedStyles.statusButtonText,
                  book.status === status && styles.statusButtonTextActive,
                ]}
              >
                {STATUS_LABELS[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {book.purchaseReason && (
        <View style={[styles.section, themedStyles.section]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>📝 購入動機</Text>
          <Text style={[styles.noteText, themedStyles.noteText]}>{book.purchaseReason}</Text>
        </View>
      )}

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>書籍情報</Text>
        <InfoRow label="ISBN" value={book.isbn || '-'} colors={colors} />
        <InfoRow label="出版日" value={book.publishedDate || '-'} colors={colors} />
        <InfoRow label="ページ数" value={book.pageCount ? `${book.pageCount}ページ` : '-'} colors={colors} />
      </View>

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>購入情報</Text>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>本の状態</Text>
          <View style={[styles.conditionBadge, { backgroundColor: CONDITION_COLORS[book.condition] }]}>
            <Text style={styles.conditionBadgeText}>{CONDITION_LABELS[book.condition]}</Text>
          </View>
        </View>
        <InfoRow label="購入日" value={formatDate(book.purchaseDate)} colors={colors} />
        <InfoRow label="購入場所" value={book.purchasePlace || '-'} colors={colors} />
        <InfoRow label="購入価格" value={formatPrice(book.purchasePrice)} colors={colors} />
      </View>

      {book.tags.length > 0 && (
        <View style={[styles.section, themedStyles.section]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>タグ</Text>
          <View style={styles.tags}>
            {book.tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {book.notes && (
        <View style={[styles.section, themedStyles.section]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>📄 メモ</Text>
          <Text style={[styles.noteText, themedStyles.noteText]}>{book.notes}</Text>
        </View>
      )}

      <View style={[styles.section, themedStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>記録</Text>
        <InfoRow label="登録日" value={formatDate(book.createdAt)} colors={colors} />
        <InfoRow label="読書開始日" value={formatDate(book.startDate)} colors={colors} />
        <InfoRow label="読了日" value={formatDate(book.completedDate)} colors={colors} />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('BookEdit', { bookId: book.id })}
        >
          <Text style={styles.editButtonText}>この本を編集する</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? '削除中...' : 'この本を削除する'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  colors: {
    textSecondary: string;
    textPrimary: string;
    borderLight: string;
  };
}

function InfoRow({ label, value, colors }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  imageContainer: {
    width: 100,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
  },
  headerInfo: {
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
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  statusButtonText: {
    fontSize: 14,
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  conditionBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minHeight: 36,
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 14,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
