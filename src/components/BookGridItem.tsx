import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';
import { STATUS_COLORS } from '../constants';
import { useSettings } from '../contexts';
import { getDaysSince } from '../utils';

interface BookGridItemProps {
  book: Book;
  onPress?: () => void;
}

export default function BookGridItem({ book, onPress }: BookGridItemProps) {
  const { isTsundoku } = useSettings();
  const tsundokuDays = getDaysSince(book.purchaseDate || book.createdAt);
  const showTsundokuDays = isTsundoku(book.status);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {book.thumbnailUrl ? (
          <Image source={{ uri: book.thumbnailUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderTitle} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}
        <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLORS[book.status] }]} />
        {showTsundokuDays && (
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>{tsundokuDays}日</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.author} numberOfLines={1}>
        {book.authors[0]}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '31%',
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
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  daysBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E91E63',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  daysBadgeText: {
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
