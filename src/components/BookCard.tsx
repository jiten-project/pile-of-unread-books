import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../constants';
import { DEVICE } from '../constants/theme';
import { useTheme, useSettings } from '../contexts';
import { getDaysSince } from '../utils';

// iPad用スケールファクター
const SCALE = DEVICE.isTablet ? 1.5 : 1.0;

interface BookCardProps {
  book: Book;
  onPress?: () => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
  const { colors } = useTheme();
  const { isTsundoku } = useSettings();

  // 積読日数を計算（購入日があれば購入日から、なければ登録日から）
  const tsundokuDays = getDaysSince(book.purchaseDate || book.createdAt);
  const showTsundokuDays = isTsundoku(book.status);

  const themedStyles = {
    container: { backgroundColor: colors.surface },
    imageContainer: { backgroundColor: colors.borderLight },
    placeholderImage: { backgroundColor: colors.border },
    placeholderText: { color: colors.textTertiary },
    title: { color: colors.textPrimary },
    authors: { color: colors.textSecondary },
    tag: { backgroundColor: colors.primaryLight },
    tagText: { color: colors.primary },
    moreTags: { color: colors.textTertiary },
    purchaseReason: { color: colors.textSecondary },
  };

  return (
    <TouchableOpacity
      style={[styles.container, themedStyles.container]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, themedStyles.imageContainer]}>
        {book.thumbnailUrl ? (
          <Image source={{ uri: book.thumbnailUrl }} style={styles.image} />
        ) : (
          <View style={[styles.placeholderImage, themedStyles.placeholderImage]}>
            <Text style={[styles.placeholderText, themedStyles.placeholderText]}>No Image</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, themedStyles.title]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.authors, themedStyles.authors]} numberOfLines={1}>
          {book.authors.join(', ')}
        </Text>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[book.status] }]}>
            <Text style={styles.badgeText}>{STATUS_LABELS[book.status]}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[book.priority] }]}>
            <Text style={styles.badgeText}>{PRIORITY_LABELS[book.priority]}</Text>
          </View>
          {showTsundokuDays && (
            <View style={[styles.badge, styles.daysBadge]}>
              <Text style={styles.badgeText}>{tsundokuDays}日</Text>
            </View>
          )}
        </View>

        {book.tags.length > 0 && (
          <View style={styles.tags}>
            {book.tags.slice(0, 3).map(tag => (
              <View key={tag} style={[styles.tag, themedStyles.tag]}>
                <Text style={[styles.tagText, themedStyles.tagText]}>{tag}</Text>
              </View>
            ))}
            {book.tags.length > 3 && (
              <Text style={[styles.moreTags, themedStyles.moreTags]}>+{book.tags.length - 3}</Text>
            )}
          </View>
        )}

        {book.purchaseReason && (
          <Text style={[styles.purchaseReason, themedStyles.purchaseReason]} numberOfLines={2}>
            📝 {book.purchaseReason}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Math.round(12 * SCALE),
    padding: Math.round(12 * SCALE),
    marginBottom: Math.round(12 * SCALE),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: Math.round(80 * SCALE),
    height: Math.round(120 * SCALE),
    borderRadius: Math.round(6 * SCALE),
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
    fontSize: Math.round(10 * SCALE),
  },
  content: {
    flex: 1,
    marginLeft: Math.round(12 * SCALE),
    justifyContent: 'space-between',
  },
  title: {
    fontSize: Math.round(16 * SCALE),
    fontWeight: 'bold',
    marginBottom: Math.round(4 * SCALE),
  },
  authors: {
    fontSize: Math.round(14 * SCALE),
    marginBottom: Math.round(8 * SCALE),
  },
  badges: {
    flexDirection: 'row',
    gap: Math.round(6 * SCALE),
    marginBottom: Math.round(8 * SCALE),
  },
  badge: {
    paddingHorizontal: Math.round(8 * SCALE),
    paddingVertical: Math.round(2 * SCALE),
    borderRadius: Math.round(10 * SCALE),
  },
  daysBadge: {
    backgroundColor: '#E91E63',
  },
  badgeText: {
    fontSize: Math.round(11 * SCALE),
    color: '#fff',
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Math.round(4 * SCALE),
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: Math.round(8 * SCALE),
    paddingVertical: Math.round(2 * SCALE),
    borderRadius: Math.round(8 * SCALE),
  },
  tagText: {
    fontSize: Math.round(11 * SCALE),
  },
  moreTags: {
    fontSize: Math.round(11 * SCALE),
  },
  purchaseReason: {
    fontSize: Math.round(12 * SCALE),
    marginTop: Math.round(6 * SCALE),
    lineHeight: Math.round(16 * SCALE),
  },
});
