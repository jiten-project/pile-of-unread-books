import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';
import { STATUS_COLORS, STATUS_LABELS, DEVICE } from '../constants';
import { useSettings } from '../contexts';
import { getDaysSince } from '../utils';

interface BookGridItemProps {
  book: Book;
  onPress?: () => void;
}

export default React.memo(function BookGridItem({ book, onPress }: BookGridItemProps) {
  const { isTsundoku } = useSettings();
  const tsundokuDays = getDaysSince(book.purchaseDate || book.createdAt);
  const showTsundokuDays = isTsundoku(book.status);

  // バッジの表示内容とカラーを決定
  const badgeText = showTsundokuDays ? `${tsundokuDays}日` : STATUS_LABELS[book.status];
  const badgeColor = showTsundokuDays ? '#E91E63' : STATUS_COLORS[book.status];

  // iPad用の拡大スタイル（DEVICEは定数なのでuseMemoは不要だが、明示的にメモ化）
  const tabletStyles = useMemo(() => DEVICE.isTablet ? {
    container: { marginBottom: 24 },
    imageContainer: { borderRadius: 10 },
    placeholderImage: { padding: 12 },
    placeholderTitle: { fontSize: 14 },
    badge: { top: 8, right: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 14 },
    title: { fontSize: 16, marginTop: 10, lineHeight: 22 },
    author: { fontSize: 14, marginTop: 4 },
  } : {}, []);

  return (
    <TouchableOpacity style={[styles.container, tabletStyles.container]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.imageContainer, tabletStyles.imageContainer]}>
        {book.thumbnailUrl ? (
          <Image source={{ uri: book.thumbnailUrl }} style={styles.image} />
        ) : (
          <View style={[styles.placeholderImage, tabletStyles.placeholderImage]}>
            <Text style={[styles.placeholderTitle, tabletStyles.placeholderTitle]} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}
        <View style={[styles.badge, { backgroundColor: badgeColor }, tabletStyles.badge]}>
          <Text style={[styles.badgeText, tabletStyles.badgeText]}>{badgeText}</Text>
        </View>
      </View>
      <Text style={[styles.title, tabletStyles.title]} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={[styles.author, tabletStyles.author]} numberOfLines={1}>
        {book.authors[0]}
      </Text>
    </TouchableOpacity>
  );
});

// iPadでは4列、iPhoneでは3列
// 幅 + marginRight の合計が100%以下になるよう調整
const GRID_ITEM_WIDTH = DEVICE.isTablet ? '22%' : '30.5%';

const styles = StyleSheet.create({
  container: {
    width: GRID_ITEM_WIDTH,
    marginRight: '2.5%',
    marginBottom: 16,
  },
  imageContainer: {
    aspectRatio: 0.7,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  placeholderTitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 6,
    lineHeight: 16,
  },
  author: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
});
