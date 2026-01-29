import { useMemo, useCallback, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, DimensionValue } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBookStore } from '../store';
import { BookCard, EmptyState } from '../components';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { DEVICE } from '../constants/theme';
import { AppNavigationProp } from '../types';
import { formatPrice } from '../utils';
import { useTheme, useSettings } from '../contexts';
import { useTsundokuStats } from '../hooks';

// 積読に関する名言・メッセージ
const TSUNDOKU_MESSAGES = [
  'いつか読める自分になった時のために',
  '積読は未来への投資である',
  '本は逃げない、だから安心して積める',
  '買った瞬間が一番読みたい時',
  '積読は可能性の山である',
  '読まない本も、本棚の一部',
  '今日買って、明日読む...かもしれない',
  '積読とは、希望のコレクション',
  '本を買う喜び、読む喜び、積む喜び',
  '積読は知識欲の証',
  '読みたい本がある、それだけで幸せ',
  '本は待ってくれる、いつまでも',
  '積読は自分への期待の表れ',
  '今日も一冊、未来の自分へ',
  '読書リストは夢のリスト',
  '積読こそ、教養への第一歩',
  '本があるだけで、部屋が豊かになる',
  '積読は罪ではない、文化である',
  '読まなくても、そこにある安心感',
  '積読は静かな決意表明',
  '愛読書は「カラマーゾフの兄弟」ですって、言いたい',
  '「純粋理性批判」、学生の頃に挑戦したなあ',
];

export default function HomeScreen() {
  const { books } = useBookStore();
  const navigation = useNavigation<AppNavigationProp>();
  const { colors } = useTheme();
  const { showWishlistInBookshelf, showReleasedInBookshelf } = useSettings();

  // 積読統計（カスタムフックで一元管理）
  const { tsundokuCount, tsundokuSpent, tsundokuPages, oldestTsundoku } = useTsundokuStats();

  // ランダムメッセージ（1分ごとに更新）
  const [randomMessage, setRandomMessage] = useState('');

  useEffect(() => {
    const getRandomMessage = () => {
      const index = Math.floor(Math.random() * TSUNDOKU_MESSAGES.length);
      setRandomMessage(TSUNDOKU_MESSAGES[index]);
    };

    // 初回表示
    getRandomMessage();

    // 1分ごとに更新
    const interval = setInterval(getRandomMessage, 60000);

    return () => clearInterval(interval);
  }, []);

  // ステータス別カウントと読書中の本を1パスで集計
  const { statusCounts, readingBooks } = useMemo(() => {
    const counts = {
      wishlist: 0,
      unread: 0,
      reading: 0,
      completed: 0,
      paused: 0,
      released: 0,
    };
    const reading: typeof books = [];

    for (const book of books) {
      counts[book.status]++;
      if (book.status === 'reading' && reading.length < 3) {
        reading.push(book);
      }
    }

    return { statusCounts: counts, readingBooks: reading };
  }, [books]);

  // iPadでの統計カードの幅を動的に計算（表示数に応じて調整）
  const statCardWidth = useMemo((): DimensionValue => {
    if (!DEVICE.isTablet) return '48.5%'; // iPhoneは2列固定
    // 基本4個 + released + wishlist
    const count = 4 + (showReleasedInBookshelf ? 1 : 0) + (showWishlistInBookshelf ? 1 : 0);
    // gap(8px) * (count-1) を考慮して幅を計算
    // 例: 4個 → 24%, 5個 → 19%, 6個 → 15.5%
    const widthPercent = Math.floor((100 - (count - 1) * 1.5) / count * 10) / 10;
    return `${widthPercent}%`;
  }, [showReleasedInBookshelf, showWishlistInBookshelf]);

  const handleBookPress = useCallback(
    (bookId: string) => {
      navigation.navigate('BookDetail', { bookId });
    },
    [navigation]
  );

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: colors.background },
      greeting: { color: colors.textPrimary },
      sectionTitle: { color: colors.textPrimary },
      priceCard: {
        backgroundColor: colors.warning + '20',
        borderColor: colors.warning + '40',
      },
      priceLabel: { color: colors.warning },
      priceValue: { color: colors.warning },
    }),
    [colors]
  );

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, themedStyles.greeting]}>積読生活</Text>
        {randomMessage && (
          <Text
            style={[styles.quoteText, { color: colors.textTertiary }]}
            numberOfLines={2}
          >
            {randomMessage}
          </Text>
        )}
      </View>

      {/* iPhoneでは積読金額・ページ数を先に表示 */}
      {!DEVICE.isTablet && (tsundokuSpent > 0 || tsundokuPages > 0) && (
        <View style={styles.summaryRow}>
          {tsundokuSpent > 0 && (
            <View style={[styles.summaryCard, themedStyles.priceCard]}>
              <Text style={[styles.summaryLabel, themedStyles.priceLabel]}>積読金額</Text>
              <Text style={[styles.summaryValue, themedStyles.priceValue]}>
                {formatPrice(tsundokuSpent)}
              </Text>
            </View>
          )}
          {tsundokuPages > 0 && (
            <View style={[styles.summaryCard, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
              <Text style={[styles.summaryLabel, { color: colors.primary }]}>積読ページ</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {tsundokuPages.toLocaleString()}頁
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 積読カウントと積読金額（iPadでは横並び） */}
      <View style={styles.tsundokuRow}>
        <View style={[styles.tsundokuCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tsundokuHeader}>
            <Text style={styles.tsundokuIcon}>📚</Text>
            <Text style={[styles.tsundokuLabel, { color: colors.textSecondary }]}>
              あなたの積読
            </Text>
          </View>
          <Text style={[styles.tsundokuValue, { color: colors.textPrimary }]}>
            {tsundokuCount}
            <Text style={styles.tsundokuUnit}> 冊</Text>
          </Text>
        </View>

        {DEVICE.isTablet && tsundokuSpent > 0 && (
          <View style={[styles.tsundokuCard, styles.priceCardInRow, themedStyles.priceCard]}>
            <Text style={[styles.priceLabel, themedStyles.priceLabel]}>積読金額</Text>
            <Text style={[styles.priceValue, themedStyles.priceValue]}>
              {formatPrice(tsundokuSpent)}
            </Text>
          </View>
        )}
        {DEVICE.isTablet && tsundokuPages > 0 && (
          <View style={[styles.tsundokuCard, styles.priceCardInRow, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
            <Text style={[styles.priceLabel, { color: colors.primary }]}>積読ページ</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {tsundokuPages.toLocaleString()}頁
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        {[
          { key: 'unread', icon: '📚', show: true },
          { key: 'reading', icon: '📖', show: true },
          { key: 'paused', icon: '⏸️', show: true },
          { key: 'completed', icon: '✅', show: true },
          { key: 'released', icon: '🕊️', show: showReleasedInBookshelf },
          { key: 'wishlist', icon: '💕', show: showWishlistInBookshelf },
        ]
          .filter(item => item.show)
          .map(item => (
            <StatCard
              key={item.key}
              label={STATUS_LABELS[item.key as keyof typeof STATUS_LABELS]}
              value={statusCounts[item.key as keyof typeof statusCounts]}
              color={STATUS_COLORS[item.key as keyof typeof STATUS_COLORS]}
              icon={item.icon}
              cardBgColor={colors.surface}
              textColor={colors.textPrimary}
              labelColor={colors.textSecondary}
              cardWidth={statCardWidth}
            />
          ))}
      </View>

      {oldestTsundoku && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
            最も長く積んでいる本
          </Text>
          <BookCard
            book={oldestTsundoku}
            onPress={() => handleBookPress(oldestTsundoku.id)}
            size="large"
          />
        </View>
      )}

      {readingBooks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>読書中の本</Text>
          {readingBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onPress={() => handleBookPress(book.id)}
              size="large"
            />
          ))}
        </View>
      )}

      {books.length === 0 && (
        <EmptyState
          icon="📚"
          title="まだ本が登録されていません"
          description="本を登録して積読管理を始めましょう"
          actionLabel="本を登録する"
          onAction={() => navigation.navigate('AddBook')}
        />
      )}
    </ScrollView>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: string;
  cardBgColor: string;
  textColor: string;
  labelColor: string;
  cardWidth?: DimensionValue;
}

function StatCard({ label, value, color, icon, cardBgColor, textColor, labelColor, cardWidth }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: cardBgColor, width: cardWidth }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: DEVICE.isTablet ? 24 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DEVICE.isTablet ? 16 : 14,
    gap: 12,
  },
  tsundokuRow: {
    flexDirection: DEVICE.isTablet ? 'row' : 'column',
    gap: DEVICE.isTablet ? 12 : 0,
    marginBottom: DEVICE.isTablet ? 12 : 0,
  },
  greeting: {
    fontSize: DEVICE.isTablet ? 40 : 24,
    fontWeight: 'bold',
  },
  total: {
    fontSize: 14,
    marginTop: 4,
  },
  quoteText: {
    flexShrink: 1,
    fontSize: DEVICE.isTablet ? 18 : 13,
    fontStyle: 'italic',
    lineHeight: DEVICE.isTablet ? 26 : 18,
  },
  tsundokuCard: {
    flex: DEVICE.isTablet ? 1 : undefined,
    borderRadius: 12,
    padding: DEVICE.isTablet ? 16 : 16,
    marginBottom: DEVICE.isTablet ? 0 : 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardInRow: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  tsundokuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DEVICE.isTablet ? 6 : 4,
  },
  tsundokuIcon: {
    fontSize: DEVICE.isTablet ? 30 : 20,
    marginRight: 8,
  },
  tsundokuLabel: {
    fontSize: DEVICE.isTablet ? 18 : 14,
    fontWeight: '600',
  },
  tsundokuValue: {
    fontSize: DEVICE.isTablet ? 52 : 40,
    fontWeight: 'bold',
  },
  tsundokuUnit: {
    fontSize: DEVICE.isTablet ? 22 : 18,
    fontWeight: 'normal',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: DEVICE.isTablet ? 8 : 0,
    marginBottom: DEVICE.isTablet ? 12 : 12,
  },
  statCard: {
    // 幅はcardWidth propで動的に設定
    marginBottom: DEVICE.isTablet ? 10 : 8,
    borderRadius: 12,
    padding: DEVICE.isTablet ? 10 : 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: DEVICE.isTablet ? 26 : 20,
    marginBottom: DEVICE.isTablet ? 6 : 4,
  },
  statValue: {
    fontSize: DEVICE.isTablet ? 32 : 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: DEVICE.isTablet ? 15 : 14,
    marginTop: 2,
  },
  priceCard: {
    borderRadius: 12,
    padding: DEVICE.isTablet ? 14 : 16,
    marginBottom: DEVICE.isTablet ? 12 : 20,
    borderWidth: 1,
  },
  priceLabel: {
    fontSize: DEVICE.isTablet ? 18 : 14,
    textAlign: 'center',
  },
  priceValue: {
    fontSize: DEVICE.isTablet ? 34 : 28,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: DEVICE.isTablet ? 14 : 16,
  },
  sectionTitle: {
    fontSize: DEVICE.isTablet ? 26 : 16,
    fontWeight: 'bold',
    marginBottom: DEVICE.isTablet ? 14 : 8,
  },
});
