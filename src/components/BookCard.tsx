import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, DEVICE } from '../constants';
import { useTheme, useSettings } from '../contexts';
import { getDaysSince } from '../utils';

interface BookCardProps {
  book: Book;
  onPress?: () => void;
  size?: 'normal' | 'large';
}

export default React.memo(function BookCard({ book, onPress, size = 'normal' }: BookCardProps) {
  // iPadでlargeサイズの場合は拡大
  const isLarge = size === 'large' && DEVICE.isTablet;
  const { colors } = useTheme();
  const { isTsundoku } = useSettings();

  // 積読日数を計算（購入日があれば購入日から、なければ登録日から）
  const tsundokuDays = getDaysSince(book.purchaseDate || book.createdAt);
  const showTsundokuDays = isTsundoku(book.status);

  const themedStyles = useMemo(() => ({
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
  }), [colors]);

  // サイズに応じたスタイル（iPadのlargeサイズ用）
  const sizeStyles = useMemo(() => isLarge ? {
    container: { padding: 24, marginBottom: 16 },
    imageContainer: { width: 160, height: 240 },
    content: { marginLeft: 20 },
    title: { fontSize: 26, marginBottom: 10, lineHeight: 34 },
    authors: { fontSize: 20, marginBottom: 14 },
    badges: { gap: 10, marginBottom: 12 },
    badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
    badgeText: { fontSize: 16 },
    tags: { gap: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 5 },
    tagText: { fontSize: 16 },
    purchaseReason: { fontSize: 18, lineHeight: 26, marginTop: 12 },
    placeholderText: { fontSize: 16 },
  } : {}, [isLarge]);

  return (
    <TouchableOpacity
      style={[styles.container, themedStyles.container, sizeStyles.container]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, themedStyles.imageContainer, sizeStyles.imageContainer]}>
        {book.thumbnailUrl ? (
          <Image source={{ uri: book.thumbnailUrl }} style={styles.image} />
        ) : (
          <View style={[styles.placeholderImage, themedStyles.placeholderImage]}>
            <Text style={[styles.placeholderText, themedStyles.placeholderText, sizeStyles.placeholderText]}>No Image</Text>
          </View>
        )}
      </View>

      <View style={[styles.content, sizeStyles.content]}>
        <Text style={[styles.title, themedStyles.title, sizeStyles.title]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.authors, themedStyles.authors, sizeStyles.authors]} numberOfLines={1}>
          {book.authors.join(', ')}
        </Text>

        <View style={[styles.badges, sizeStyles.badges]}>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[book.status] }, sizeStyles.badge]}>
            <Text style={[styles.badgeText, sizeStyles.badgeText]}>{STATUS_LABELS[book.status]}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[book.priority] }, sizeStyles.badge]}>
            <Text style={[styles.badgeText, sizeStyles.badgeText]}>{PRIORITY_LABELS[book.priority]}</Text>
          </View>
          {showTsundokuDays && (
            <View style={[styles.badge, styles.daysBadge, sizeStyles.badge]}>
              <Text style={[styles.badgeText, sizeStyles.badgeText]}>{tsundokuDays}日</Text>
            </View>
          )}
        </View>

        {book.tags.length > 0 && (
          <View style={[styles.tags, sizeStyles.tags]}>
            {book.tags.slice(0, 3).map(tag => (
              <View key={tag} style={[styles.tag, themedStyles.tag, sizeStyles.tag]}>
                <Text style={[styles.tagText, themedStyles.tagText, sizeStyles.tagText]}>{tag}</Text>
              </View>
            ))}
            {book.tags.length > 3 && (
              <Text style={[styles.moreTags, themedStyles.moreTags, sizeStyles.tagText]}>+{book.tags.length - 3}</Text>
            )}
          </View>
        )}

        {book.purchaseReason && (
          <Text style={[styles.purchaseReason, themedStyles.purchaseReason, sizeStyles.purchaseReason]} numberOfLines={2}>
            📝 {book.purchaseReason}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 120,
    borderRadius: 6,
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
    fontSize: 10,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  authors: {
    fontSize: 14,
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  daysBadge: {
    backgroundColor: '#E91E63',
  },
  badgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
  },
  moreTags: {
    fontSize: 11,
  },
  purchaseReason: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
});
