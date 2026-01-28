import { useMemo, useCallback, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { tsundokuCount, tsundokuSpent, oldestTsundoku } = useTsundokuStats();

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

  // ステータス別カウント
  const statusCounts = useMemo(() => {
    return {
      wishlist: books.filter(b => b.status === 'wishlist').length,
      unread: books.filter(b => b.status === 'unread').length,
      reading: books.filter(b => b.status === 'reading').length,
      completed: books.filter(b => b.status === 'completed').length,
      paused: books.filter(b => b.status === 'paused').length,
      released: books.filter(b => b.status === 'released').length,
    };
  }, [books]);

  const readingBooks = useMemo(
    () => books.filter(b => b.status === 'reading').slice(0, 3),
    [books]
  );

  // iPadでの統計カードの幅を動的に計算（表示数に応じて調整）
  const statCardWidth = useMemo(() => {
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
      priceHint: { color: colors.warning + 'CC' },
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
          <Text style={[styles.quoteText, { color: colors.textTertiary }]}>
            {randomMessage}
          </Text>
        )}
      </View>

      {/* 積読カウントと購入総額（iPadでは横並び） */}
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
            <Text style={[styles.priceLabel, themedStyles.priceLabel]}>積読本の購入総額</Text>
            <Text style={[styles.priceValue, themedStyles.priceValue]}>
              {formatPrice(tsundokuSpent)}
            </Text>
            <Text style={[styles.priceHint, themedStyles.priceHint]}>読むと元が取れます！</Text>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label={STATUS_LABELS.unread}
          value={statusCounts.unread}
          color={STATUS_COLORS.unread}
          icon="📚"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
          cardWidth={statCardWidth}
        />
        <StatCard
          label={STATUS_LABELS.reading}
          value={statusCounts.reading}
          color={STATUS_COLORS.reading}
          icon="📖"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
          cardWidth={statCardWidth}
        />
        <StatCard
          label={STATUS_LABELS.paused}
          value={statusCounts.paused}
          color={STATUS_COLORS.paused}
          icon="⏸️"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
          cardWidth={statCardWidth}
        />
        <StatCard
          label={STATUS_LABELS.completed}
          value={statusCounts.completed}
          color={STATUS_COLORS.completed}
          icon="✅"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
          cardWidth={statCardWidth}
        />
        {showReleasedInBookshelf && (
          <StatCard
            label={STATUS_LABELS.released}
            value={statusCounts.released}
            color={STATUS_COLORS.released}
            icon="🕊️"
            cardBgColor={colors.surface}
            textColor={colors.textPrimary}
            labelColor={colors.textSecondary}
            cardWidth={statCardWidth}
          />
        )}
        {showWishlistInBookshelf && (
          <StatCard
            label={STATUS_LABELS.wishlist}
            value={statusCounts.wishlist}
            color={STATUS_COLORS.wishlist}
            icon="💕"
            cardBgColor={colors.surface}
            textColor={colors.textPrimary}
            labelColor={colors.textSecondary}
            cardWidth={statCardWidth}
          />
        )}
      </View>

      {!DEVICE.isTablet && tsundokuSpent > 0 && (
        <View style={[styles.priceCard, themedStyles.priceCard]}>
          <Text style={[styles.priceLabel, themedStyles.priceLabel]}>積読本の購入総額</Text>
          <Text style={[styles.priceValue, themedStyles.priceValue]}>
            {formatPrice(tsundokuSpent)}
          </Text>
          <Text style={[styles.priceHint, themedStyles.priceHint]}>読むと元が取れます！</Text>
        </View>
      )}

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
  cardWidth?: string;
}

function StatCard({ label, value, color, icon, cardBgColor, textColor, labelColor, cardWidth }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: cardBgColor, width: cardWidth as any }]}>
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
    marginBottom: DEVICE.isTablet ? 16 : 20,
  },
  tsundokuRow: {
    flexDirection: DEVICE.isTablet ? 'row' : 'column',
    gap: DEVICE.isTablet ? 12 : 0,
    marginBottom: DEVICE.isTablet ? 12 : 0,
  },
  greeting: {
    fontSize: DEVICE.isTablet ? 34 : 28,
    fontWeight: 'bold',
  },
  total: {
    fontSize: 14,
    marginTop: 4,
  },
  quoteText: {
    fontSize: DEVICE.isTablet ? 20 : 16,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: DEVICE.isTablet ? 30 : 24,
  },
  tsundokuCard: {
    flex: DEVICE.isTablet ? 1 : undefined,
    borderRadius: 12,
    padding: DEVICE.isTablet ? 16 : 20,
    marginBottom: DEVICE.isTablet ? 0 : 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardInRow: {
    borderWidth: 1,
  },
  tsundokuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DEVICE.isTablet ? 6 : 8,
  },
  tsundokuIcon: {
    fontSize: DEVICE.isTablet ? 30 : 24,
    marginRight: 8,
  },
  tsundokuLabel: {
    fontSize: DEVICE.isTablet ? 18 : 14,
    fontWeight: '600',
  },
  tsundokuValue: {
    fontSize: DEVICE.isTablet ? 52 : 48,
    fontWeight: 'bold',
  },
  tsundokuUnit: {
    fontSize: DEVICE.isTablet ? 22 : 20,
    fontWeight: 'normal',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: DEVICE.isTablet ? 8 : 0,
    marginBottom: DEVICE.isTablet ? 12 : 20,
  },
  statCard: {
    // 幅はcardWidth propで動的に設定
    marginBottom: DEVICE.isTablet ? 10 : 12,
    borderRadius: 12,
    padding: DEVICE.isTablet ? 10 : 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: DEVICE.isTablet ? 26 : 24,
    marginBottom: DEVICE.isTablet ? 6 : 8,
  },
  statValue: {
    fontSize: DEVICE.isTablet ? 32 : 32,
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
  },
  priceValue: {
    fontSize: DEVICE.isTablet ? 34 : 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  priceHint: {
    fontSize: DEVICE.isTablet ? 15 : 12,
    marginTop: 4,
  },
  section: {
    marginBottom: DEVICE.isTablet ? 14 : 20,
  },
  sectionTitle: {
    fontSize: DEVICE.isTablet ? 22 : 18,
    fontWeight: 'bold',
    marginBottom: DEVICE.isTablet ? 14 : 12,
  },
});
