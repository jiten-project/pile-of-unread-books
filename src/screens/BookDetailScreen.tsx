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
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, CONDITION_LABELS, CONDITION_COLORS, DEVICE } from '../constants';
import { formatDate, formatPrice, formatPublishedDate, joinWithComma, getMaturityLevel, calculateTsundokuDays } from '../utils';
import { useTheme, useSettings } from '../contexts';

export default function BookDetailScreen() {
  const route = useRoute<BookDetailRouteProp>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { bookId } = route.params;
  const { getBookById } = useBookStore();
  const { updateBook, updateStatus, deleteBook } = usePersistBook();
  const { colors } = useTheme();
  const { showWishlistInBookshelf, showReleasedInBookshelf, showMaturity, isTsundoku } = useSettings();
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

  // iPad用の拡大スタイル
  const tabletStyles = DEVICE.isTablet ? {
    content: { padding: 24, paddingBottom: 60 },
    header: { padding: 24, marginBottom: 24 },
    imageContainer: { width: 160, height: 240 },
    headerInfo: { marginLeft: 24 },
    title: { fontSize: 28, marginBottom: 8 },
    authors: { fontSize: 20, marginBottom: 8 },
    publisher: { fontSize: 16, marginBottom: 12 },
    badges: { gap: 10 },
    badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
    badgeText: { fontSize: 16 },
    section: { padding: 24, marginBottom: 24 },
    sectionTitle: { fontSize: 22, marginBottom: 16 },
    statusButtons: { gap: 12 },
    statusButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, minHeight: 56 },
    statusButtonText: { fontSize: 18 },
    infoRow: { paddingVertical: 12 },
    infoLabel: { fontSize: 18 },
    infoValue: { fontSize: 18 },
    conditionBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    conditionBadgeText: { fontSize: 16 },
    tags: { gap: 12 },
    tag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minHeight: 44 },
    tagText: { fontSize: 18 },
    noteText: { fontSize: 18, lineHeight: 28 },
    actionButtons: { gap: 16, marginTop: 16 },
    actionButton: { paddingVertical: 20, borderRadius: 16 },
    actionButtonText: { fontSize: 20 },
    placeholderText: { fontSize: 16 },
  } : {};

  if (!book) {
    return (
      <View style={[styles.container, themedStyles.container]}>
        <Text style={[styles.errorText, themedStyles.errorText]}>本が見つかりません</Text>
      </View>
    );
  }

  // 熟成度の計算（積読本のみ）
  const isBookTsundoku = isTsundoku(book.status);
  const maturityLevel = isBookTsundoku
    ? getMaturityLevel(calculateTsundokuDays(book.purchaseDate, book.createdAt))
    : null;

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

  // 今日の日付をISO形式で取得
  const getTodayISO = () => new Date().toISOString().split('T')[0];

  // 購入日を今日に設定
  const handleSetPurchaseDate = async () => {
    await updateBook(book.id, { purchaseDate: getTodayISO() });
  };

  // 読書開始日を今日に設定
  const handleSetStartDate = async () => {
    await updateBook(book.id, { startDate: getTodayISO() });
  };

  // 読了日を今日に設定
  const handleSetCompletedDate = async () => {
    await updateBook(book.id, { completedDate: getTodayISO() });
  };

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={[styles.content, tabletStyles.content]}
    >
      <View style={[styles.header, themedStyles.header, tabletStyles.header]}>
        <View style={[styles.imageContainer, tabletStyles.imageContainer]}>
          {book.thumbnailUrl ? (
            <Image source={{ uri: book.thumbnailUrl }} style={styles.image} />
          ) : (
            <View style={[styles.placeholderImage, themedStyles.placeholderImage]}>
              <Text style={[styles.placeholderText, themedStyles.placeholderText, tabletStyles.placeholderText]}>No Image</Text>
            </View>
          )}
        </View>

        <View style={[styles.headerInfo, tabletStyles.headerInfo]}>
          <Text style={[styles.title, themedStyles.title, tabletStyles.title]}>{book.title}</Text>
          <Text style={[styles.authors, themedStyles.authors, tabletStyles.authors]}>{joinWithComma(book.authors)}</Text>
          {book.publisher && (
            <Text style={[styles.publisher, themedStyles.publisher, tabletStyles.publisher]}>{book.publisher}</Text>
          )}

          <View style={[styles.badges, tabletStyles.badges]}>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[book.status] }, tabletStyles.badge]}>
              <Text style={[styles.badgeText, tabletStyles.badgeText]}>{STATUS_LABELS[book.status]}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[book.priority] }, tabletStyles.badge]}>
              <Text style={[styles.badgeText, tabletStyles.badgeText]}>優先度: {PRIORITY_LABELS[book.priority]}</Text>
            </View>
            {showMaturity && maturityLevel && (
              <View style={[styles.maturityBadge, { backgroundColor: maturityLevel.color }, tabletStyles.badge]}>
                <Text style={[styles.maturityBadgeText, tabletStyles.badgeText]}>
                  {maturityLevel.icon} {maturityLevel.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>ステータス変更</Text>
        <View style={[styles.statusButtons, tabletStyles.statusButtons]}>
          {(Object.keys(STATUS_LABELS) as BookStatus[])
            .filter(status => {
              // 設定でOFFの場合は非表示
              if (status === 'wishlist' && !showWishlistInBookshelf) return false;
              if (status === 'released' && !showReleasedInBookshelf) return false;
              return true;
            })
            .map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  themedStyles.statusButton,
                  tabletStyles.statusButton,
                  book.status === status && { backgroundColor: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] },
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    themedStyles.statusButtonText,
                    tabletStyles.statusButtonText,
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
        <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>📝 購入動機</Text>
          <Text style={[styles.noteText, themedStyles.noteText, tabletStyles.noteText]}>{book.purchaseReason}</Text>
        </View>
      )}

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>書籍情報</Text>
        <InfoRow label="ISBN" value={book.isbn || '-'} colors={colors} tabletStyles={tabletStyles} />
        <InfoRow label="出版日" value={formatPublishedDate(book.publishedDate)} colors={colors} tabletStyles={tabletStyles} />
        <InfoRow label="ページ数" value={book.pageCount ? `${book.pageCount}ページ` : '-'} colors={colors} tabletStyles={tabletStyles} />
      </View>

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>購入情報</Text>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }, tabletStyles.infoRow]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }, tabletStyles.infoLabel]}>本の状態</Text>
          <View style={[styles.conditionBadge, { backgroundColor: CONDITION_COLORS[book.condition] }, tabletStyles.conditionBadge]}>
            <Text style={[styles.conditionBadgeText, tabletStyles.conditionBadgeText]}>{CONDITION_LABELS[book.condition]}</Text>
          </View>
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }, tabletStyles.infoRow]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }, tabletStyles.infoLabel]}>購入日</Text>
          {book.purchaseDate ? (
            <Text style={[styles.infoValue, { color: colors.textPrimary }, tabletStyles.infoValue]}>{formatDate(book.purchaseDate)}</Text>
          ) : (
            <TouchableOpacity
              style={[styles.setDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={handleSetPurchaseDate}
              activeOpacity={0.7}
            >
              <Text style={[styles.setDateButtonText, { color: colors.primary }]}>今日</Text>
            </TouchableOpacity>
          )}
        </View>
        <InfoRow label="購入場所" value={book.purchasePlace || '-'} colors={colors} tabletStyles={tabletStyles} />
        <InfoRow label="購入価格" value={formatPrice(book.purchasePrice)} colors={colors} tabletStyles={tabletStyles} />
      </View>

      {book.tags.length > 0 && (
        <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>タグ</Text>
          <View style={[styles.tags, tabletStyles.tags]}>
            {book.tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primaryLight }, tabletStyles.tag]}>
                <Text style={[styles.tagText, { color: colors.primary }, tabletStyles.tagText]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {book.notes && (
        <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>📄 メモ</Text>
          <Text style={[styles.noteText, themedStyles.noteText, tabletStyles.noteText]}>{book.notes}</Text>
        </View>
      )}

      <View style={[styles.section, themedStyles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle, tabletStyles.sectionTitle]}>記録</Text>
        <InfoRow label="登録日" value={formatDate(book.createdAt)} colors={colors} tabletStyles={tabletStyles} />
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }, tabletStyles.infoRow]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }, tabletStyles.infoLabel]}>読書開始日</Text>
          {book.startDate ? (
            <Text style={[styles.infoValue, { color: colors.textPrimary }, tabletStyles.infoValue]}>{formatDate(book.startDate)}</Text>
          ) : (
            <TouchableOpacity
              style={[styles.setDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={handleSetStartDate}
              activeOpacity={0.7}
            >
              <Text style={[styles.setDateButtonText, { color: colors.primary }]}>今日</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }, tabletStyles.infoRow]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }, tabletStyles.infoLabel]}>読了日</Text>
          {book.completedDate ? (
            <Text style={[styles.infoValue, { color: colors.textPrimary }, tabletStyles.infoValue]}>{formatDate(book.completedDate)}</Text>
          ) : (
            <TouchableOpacity
              style={[styles.setDateButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={handleSetCompletedDate}
              activeOpacity={0.7}
            >
              <Text style={[styles.setDateButtonText, { color: colors.primary }]}>今日</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.actionButtons, tabletStyles.actionButtons]}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary }, tabletStyles.actionButton]}
          onPress={() => navigation.navigate('BookEdit', { bookId: book.id })}
        >
          <Text style={[styles.editButtonText, tabletStyles.actionButtonText]}>この本を編集する</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, tabletStyles.actionButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Text style={[styles.deleteButtonText, tabletStyles.actionButtonText]}>
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
  tabletStyles?: {
    infoRow?: object;
    infoLabel?: object;
    infoValue?: object;
  };
}

function InfoRow({ label, value, colors, tabletStyles = {} }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.borderLight }, tabletStyles.infoRow]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }, tabletStyles.infoLabel]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }, tabletStyles.infoValue]}>{value}</Text>
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
  maturityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  maturityBadgeText: {
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
  setDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  setDateButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
