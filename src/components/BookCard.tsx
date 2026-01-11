import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../constants';
import { useTheme } from '../contexts';

interface BookCardProps {
  book: Book;
  onPress?: () => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
  const { colors } = useTheme();

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
      </View>
    </TouchableOpacity>
  );
}

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
});
