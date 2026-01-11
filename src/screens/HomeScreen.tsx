import { useMemo, useCallback, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBookStore } from '../store';
import { BookCard, EmptyState } from '../components';
import { STATUS_LABELS, STATUS_COLORS } from '../constants';
import { AppNavigationProp } from '../types';
import { getDaysSince, formatPrice, joinWithComma } from '../utils';
import { useTheme, useSettings } from '../contexts';

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
  'あ、それ原書で読んだって言いたくて買ってみた',
  'PTAのこの映画の原作、ピンチョンなんだって、本棚にあったな',
  '「純粋理性批判」、学生の頃に挑戦したなあ',
];

export default function HomeScreen() {
  const { books } = useBookStore();
  const navigation = useNavigation<AppNavigationProp>();
  const { colors } = useTheme();
  const { isTsundoku } = useSettings();

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

  const stats = useMemo(() => {
    const unread = books.filter(b => b.status === 'unread').length;
    const reading = books.filter(b => b.status === 'reading').length;
    const completed = books.filter(b => b.status === 'completed').length;
    const paused = books.filter(b => b.status === 'paused').length;

    // ユーザー定義に基づく積読数
    const tsundokuCount = books.filter(b => isTsundoku(b.status)).length;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const completedThisMonth = books.filter(
      b => b.completedDate && new Date(b.completedDate) >= thisMonth
    ).length;

    // ユーザー定義に基づく積読本の購入総額
    const totalTsundokuPrice = books
      .filter(b => isTsundoku(b.status) && b.purchasePrice)
      .reduce((sum, b) => sum + (b.purchasePrice || 0), 0);

    // ユーザー定義に基づく最も古い積読本
    const oldestTsundoku = books
      .filter(b => isTsundoku(b.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    return {
      unread,
      reading,
      completed,
      paused,
      tsundokuCount,
      total: books.length,
      completedThisMonth,
      totalTsundokuPrice,
      oldestTsundoku,
    };
  }, [books, isTsundoku]);

  const readingBooks = useMemo(
    () => books.filter(b => b.status === 'reading').slice(0, 3),
    [books]
  );

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
      oldestCard: { backgroundColor: colors.surface },
      oldestTitle: { color: colors.textPrimary },
      oldestAuthor: { color: colors.textSecondary },
      priceCard: {
        backgroundColor: colors.warning + '20',
        borderColor: colors.warning + '40',
      },
      priceLabel: { color: colors.warning },
      priceValue: { color: colors.warning },
      priceHint: { color: colors.warning + 'CC' },
      oldestDays: { backgroundColor: colors.error + '20' },
      oldestDaysValue: { color: colors.error },
      oldestDaysLabel: { color: colors.error },
    }),
    [colors]
  );

  return (
    <ScrollView
      style={[styles.container, themedStyles.container]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, themedStyles.greeting]}>積読本管理</Text>
        {randomMessage && (
          <Text style={[styles.quoteText, { color: colors.textTertiary }]}>
            「{randomMessage}」
          </Text>
        )}
      </View>

      {/* 積読カウント（ユーザー定義に基づく） */}
      <View style={[styles.tsundokuCard, { backgroundColor: colors.surface }]}>
        <View style={styles.tsundokuHeader}>
          <Text style={styles.tsundokuIcon}>📚</Text>
          <Text style={[styles.tsundokuLabel, { color: colors.textSecondary }]}>
            あなたの積読
          </Text>
        </View>
        <Text style={[styles.tsundokuValue, { color: colors.textPrimary }]}>
          {stats.tsundokuCount}
          <Text style={styles.tsundokuUnit}> 冊</Text>
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label={STATUS_LABELS.unread}
          value={stats.unread}
          color={STATUS_COLORS.unread}
          icon="📕"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
        />
        <StatCard
          label={STATUS_LABELS.reading}
          value={stats.reading}
          color={STATUS_COLORS.reading}
          icon="📖"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
        />
        <StatCard
          label={STATUS_LABELS.paused}
          value={stats.paused}
          color={STATUS_COLORS.paused}
          icon="⏸️"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
        />
        <StatCard
          label={STATUS_LABELS.completed}
          value={stats.completed}
          color={STATUS_COLORS.completed}
          icon="✅"
          cardBgColor={colors.surface}
          textColor={colors.textPrimary}
          labelColor={colors.textSecondary}
        />
      </View>

      {stats.totalTsundokuPrice > 0 && (
        <View style={[styles.priceCard, themedStyles.priceCard]}>
          <Text style={[styles.priceLabel, themedStyles.priceLabel]}>積読本の購入総額</Text>
          <Text style={[styles.priceValue, themedStyles.priceValue]}>
            {formatPrice(stats.totalTsundokuPrice)}
          </Text>
          <Text style={[styles.priceHint, themedStyles.priceHint]}>読むと元が取れます！</Text>
        </View>
      )}

      {stats.oldestTsundoku && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
            最も長く積んでいる本
          </Text>
          <TouchableOpacity
            style={[styles.oldestCard, themedStyles.oldestCard]}
            onPress={() => handleBookPress(stats.oldestTsundoku!.id)}
          >
            <View style={styles.oldestInfo}>
              <Text style={[styles.oldestTitle, themedStyles.oldestTitle]} numberOfLines={1}>
                {stats.oldestTsundoku.title}
              </Text>
              <Text style={[styles.oldestAuthor, themedStyles.oldestAuthor]} numberOfLines={1}>
                {joinWithComma(stats.oldestTsundoku.authors)}
              </Text>
            </View>
            <View style={[styles.oldestDays, themedStyles.oldestDays]}>
              <Text style={[styles.oldestDaysValue, themedStyles.oldestDaysValue]}>
                {getDaysSince(stats.oldestTsundoku.createdAt)}
              </Text>
              <Text style={[styles.oldestDaysLabel, themedStyles.oldestDaysLabel]}>日</Text>
            </View>
          </TouchableOpacity>
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
}

function StatCard({ label, value, color, icon, cardBgColor, textColor, labelColor }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: cardBgColor }]}>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  total: {
    fontSize: 14,
    marginTop: 4,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 24,
  },
  tsundokuCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tsundokuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tsundokuIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tsundokuLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tsundokuValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  tsundokuUnit: {
    fontSize: 20,
    fontWeight: 'normal',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  priceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  priceHint: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  oldestCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  oldestInfo: {
    flex: 1,
  },
  oldestTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  oldestAuthor: {
    fontSize: 14,
    marginTop: 2,
  },
  oldestDays: {
    alignItems: 'center',
    marginLeft: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  oldestDaysValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  oldestDaysLabel: {
    fontSize: 12,
  },
});
