import React, { useMemo, useCallback, useState, useEffect } from 'react';
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
  '本棚は心の地図である',
  '積読は未読ではなく、予約席',
  '本との出会いは一期一会',
  '積読は知的好奇心のバロメーター',
  '読む前から、もう楽しんでいる',
  '本を買うのは、未来の自分へのプレゼント',
  '積読山脈、今日も成長中',
  '本に囲まれて眠る幸せ',
  '積読は「いつか」への約束',
  '買わなかった後悔より、買った満足',
  '本は最高のインテリア',
  '積読は心の備蓄である',
  '読みたい本が尽きない人生でありたい',
  '本棚を見れば、その人がわかる',
  '積読は静かな贅沢',
  '本を買う手は止められない',
  '積読は読書家の勲章',
  '今日の積読、明日の糧',
  '本は場所を取るが、心は広げる',
  '積読は知識の種まき',
  '読まない本にも意味がある',
  '本棚は可能性の宝庫',
  '積読は焦らず、慌てず、諦めず',
  '本との縁は大切にしたい',
  '積読は自分だけの図書館づくり',
  '読書は最高の自己投資',
  '積読家に悪い人はいない',
  '本がある暮らし、それだけで豊か',
  '積読は読書の予告編',
  '本を買う理由はいつも正当',
  '積読は人生の保険',
  '本棚の前で過ごす時間が好き',
  '積読は無限の可能性を秘めている',
  '読まない自由もまた読書',
  '本は買った時点で価値がある',
  '積読は知の貯金箱',
  '本棚は自分史の縮図',
  '積読は心のセーフティネット',
  '本を愛する心に終わりはない',
  '積読は静かな抵抗',
  '本との対話はいつでもできる',
  '積読は豊かさの象徴',
  '本は最も忠実な友人',
  '積読は未来の自分への手紙',
  '本棚を育てる喜び',
  '積読は知的な散財',
  '本は心の栄養剤',
  '積読は夢を形にしたもの',
  '本との出会いを大切に',
  '積読は時間の預金',
  '本棚は思考の軌跡',
  '積読は優雅な趣味',
  '本を集める本能は止められない',
  '積読は精神の避難所',
  '本は何度でも待ってくれる',
  '積読は学びへの渇望',
  '本棚を眺めるだけで落ち着く',
  '積読は自分らしさの表現',
  '本は裏切らない',
  '積読は希望の灯火',
  '本との時間は至福のひととき',
  '積読は人生を彩る',
  '本棚は宇宙への窓',
  '積読は永遠の課題図書',
  '本は最高の旅の友',
  '積読は明日への活力',
  '本を手に取る瞬間が好き',
  '積読は知恵の泉',
  '本棚は自分だけの聖域',
  '積読は生きる喜び',
  '本は時を超えて語りかける',
  '積読は究極の自己表現',
  '本との邂逅に感謝',
  '積読は人生の彩り',
  '本は永遠の先生',
  '積読があるから、明日も頑張れる',
  '本は人生最良の伴走者',
  '積読は終わりのない物語',
  '「失われた時を求めて」、いつか時間を見つけて',
  '村上春樹の新刊、発売日に買って積んでる',
  '「資本論」、表紙だけは覚えた',
  '夏目漱石全集、背表紙が美しい',
  '「戦争と平和」、厚さに惹かれて購入',
  '太宰治は「人間失格」から積んでいる',
  '「百年の孤独」、百年後に読むかも',
  '司馬遼太郎、何巻まで買ったっけ',
  '「源氏物語」、現代語訳でも難しい',
  'サルトルの「存在と無」、存在だけしている',
  '「罪と罰」、罪悪感なく積んでいる',
  'プルーストは来世で読む予定',
  '「1984年」、2024年になってしまった',
  '芥川龍之介、短編なのに積んでいる',
  '「ドン・キホーテ」、風車のように積み上がる',
  '三島由紀夫、装丁が美しくて飾ってある',
  '「神曲」、地獄篇で止まっている',
  'マルクス・アウレリウス「自省録」、自省はまだ',
  '「こころ」は読んだ、続きはいつか',
  'カフカの「城」、入り口で迷子中',
];

export default function HomeScreen() {
  const books = useBookStore(state => state.books);
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

const StatCard = React.memo(function StatCard({ label, value, color, icon, cardBgColor, textColor, labelColor, cardWidth }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: cardBgColor, width: cardWidth }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
});

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
