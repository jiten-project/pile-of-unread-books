import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useBookStore } from '../store';
import { STATUS_LABELS, STATUS_COLORS, DEVICE } from '../constants';
import { BookStatus } from '../types';
import { EmptyState } from '../components';
import { useTsundokuStats } from '../hooks';
import { useTheme } from '../contexts';

type ChartPeriod = 3 | 6 | 12;

const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: 3, label: '3ヶ月' },
  { value: 6, label: '6ヶ月' },
  { value: 12, label: '12ヶ月' },
];

const isTablet = DEVICE.isTablet;

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForLabels: {
    fontSize: isTablet ? 16 : 12,
  },
};

// iPad用の拡大スタイル
const tabletStyles = isTablet ? {
  content: { padding: 24, paddingBottom: 60 },
  summaryRow: { gap: 16, marginBottom: 16 },
  summaryCard: { padding: 24, borderLeftWidth: 6, borderRadius: 16 },
  summaryLabel: { fontSize: 16, marginBottom: 6 },
  summaryValue: { fontSize: 32 },
  section: { padding: 24, marginBottom: 24, borderRadius: 16 },
  sectionTitle: { fontSize: 20, marginBottom: 20 },
  tagRow: { paddingVertical: 12 },
  tagRank: { width: 32, fontSize: 18 },
  tagName: { fontSize: 18 },
  tagCount: { fontSize: 18 },
  periodButton: { paddingHorizontal: 14, paddingVertical: 8 },
  periodButtonText: { fontSize: 14 },
} : {};

export default function StatsScreen() {
  const { books } = useBookStore();
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(6);

  // 積読統計（カスタムフックで一元管理）
  const { tsundokuSpent, avgTsundokuDays, tsundokuPages } = useTsundokuStats();

  const stats = useMemo(() => {
    // ステータス別集計
    const statusCounts: Record<BookStatus, number> = {
      wishlist: 0,
      unread: 0,
      reading: 0,
      paused: 0,
      completed: 0,
      released: 0,
    };
    books.forEach(book => {
      statusCounts[book.status]++;
    });

    const now = new Date();

    // 月別積読推移（選択された期間）- 各月末時点での積読金額とページ数
    const monthlyUnread: { month: string; amount: number; pages: number }[] = [];
    for (let i = chartPeriod - 1; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      // その月末時点で積読だった本を集計
      // 購入日がその月末以前 AND (読了日がない OR 読了日がその月末より後)
      const unreadAtMonthEnd = books.filter(book => {
        // 購入日がない場合は登録日を使用
        const purchaseDate = book.purchaseDate ? new Date(book.purchaseDate) : new Date(book.createdAt);
        if (purchaseDate > monthEnd) return false; // まだ購入されていない

        if (book.status === 'completed' && book.completedDate) {
          const completedAt = new Date(book.completedDate);
          return completedAt > monthEnd; // 読了がその月末より後なら、その月末時点では積読
        }
        return book.status === 'unread' || book.status === 'reading' || book.status === 'paused';
      });

      const amount = unreadAtMonthEnd.reduce((sum, book) => sum + (book.purchasePrice || 0), 0);
      const pages = unreadAtMonthEnd.reduce((sum, book) => sum + (book.pageCount || 0), 0);

      monthlyUnread.push({
        month: `${monthEnd.getMonth() + 1}月`,
        amount,
        pages,
      });
    }

    // タグ別集計（上位5件）
    const tagCounts: Record<string, number> = {};
    books.forEach(book => {
      book.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 総購入金額
    const totalSpent = books.reduce((sum, book) => sum + (book.purchasePrice || 0), 0);

    return {
      total: books.length,
      statusCounts,
      monthlyUnread,
      topTags,
      totalSpent,
    };
  }, [books, chartPeriod]);

  const pieData = Object.entries(stats.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status as BookStatus],
      count,
      color: STATUS_COLORS[status as BookStatus],
      legendFontColor: '#333',
      legendFontSize: isTablet ? 16 : 12,
    }));

  // 金額チャートデータ（すべて0の場合は最小値1を追加してチャートを正しく描画）
  const amountData = stats.monthlyUnread.map(m => m.amount);
  const hasAmountData = amountData.some(v => v > 0);
  const amountChartData = {
    labels: stats.monthlyUnread.map(m => m.month),
    datasets: [
      {
        data: hasAmountData ? amountData : amountData.map(() => 1),
        strokeWidth: 2,
      },
    ],
  };

  // ページ数チャートデータ（すべて0の場合は最小値1を追加してチャートを正しく描画）
  const pagesData = stats.monthlyUnread.map(m => m.pages);
  const hasPagesData = pagesData.some(v => v > 0);
  const pagesChartData = {
    labels: stats.monthlyUnread.map(m => m.month),
    datasets: [
      {
        data: hasPagesData ? pagesData : pagesData.map(() => 1),
        strokeWidth: 2,
      },
    ],
  };

  if (books.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="統計データがありません"
        description="本を登録すると統計が表示されます"
      />
    );
  }

  // チャートの高さをiPad用に調整
  const chartHeight = isTablet ? 280 : 200;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, tabletStyles.content]}>
      <View style={[styles.summaryRow, tabletStyles.summaryRow]}>
        <SummaryCard label="総登録数" value={`${stats.total}冊`} color="#007AFF" />
        <SummaryCard
          label="読了率"
          value={`${Math.round((stats.statusCounts.completed / stats.total) * 100)}%`}
          color="#4CAF50"
        />
      </View>

      <View style={[styles.summaryRow, tabletStyles.summaryRow]}>
        <SummaryCard label="平均積読期間" value={`${avgTsundokuDays}日`} color="#FF9800" />
        <SummaryCard
          label="積読ページ"
          value={`${tsundokuPages.toLocaleString()}P`}
          color="#2196F3"
        />
      </View>

      <View style={[styles.summaryRow, tabletStyles.summaryRow]}>
        <SummaryCard
          label="積読金額"
          value={`¥${tsundokuSpent.toLocaleString()}`}
          color="#F44336"
        />
        <SummaryCard
          label="総購入金額"
          value={`¥${stats.totalSpent.toLocaleString()}`}
          color="#9C27B0"
        />
      </View>

      <View style={[styles.section, tabletStyles.section]}>
        <Text style={[styles.sectionTitle, tabletStyles.sectionTitle]}>ステータス別</Text>
        {pieData.length > 0 && (
          <PieChart
            data={pieData}
            width={screenWidth - (isTablet ? 48 : 32)}
            height={chartHeight}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        )}
      </View>

      <View style={[styles.section, tabletStyles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, tabletStyles.sectionTitle, { marginBottom: 0 }]}>積読金額の推移</Text>
          <View style={styles.periodSelector}>
            {PERIOD_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.periodButton,
                  tabletStyles.periodButton,
                  chartPeriod === option.value && { backgroundColor: colors.primary },
                ]}
                onPress={() => setChartPeriod(option.value)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    tabletStyles.periodButtonText,
                    chartPeriod === option.value && { color: '#fff' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <LineChart
          key={`amount-${chartPeriod}`}
          data={amountChartData}
          width={screenWidth - (isTablet ? 48 : 32)}
          height={chartHeight}
          yAxisLabel="¥"
          yAxisSuffix=""
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
          }}
          style={styles.chart}
          bezier
          fromZero
        />
      </View>

      <View style={[styles.section, tabletStyles.section]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, tabletStyles.sectionTitle, { marginBottom: 0 }]}>積読ページ数の推移</Text>
          <View style={styles.periodSelector}>
            {PERIOD_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.periodButton,
                  tabletStyles.periodButton,
                  chartPeriod === option.value && { backgroundColor: colors.primary },
                ]}
                onPress={() => setChartPeriod(option.value)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    tabletStyles.periodButtonText,
                    chartPeriod === option.value && { color: '#fff' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <LineChart
          key={`pages-${chartPeriod}`}
          data={pagesChartData}
          width={screenWidth - (isTablet ? 48 : 32)}
          height={chartHeight}
          yAxisLabel=""
          yAxisSuffix="P"
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          }}
          style={styles.chart}
          bezier
          fromZero
        />
      </View>

      {stats.topTags.length > 0 && (
        <View style={[styles.section, tabletStyles.section]}>
          <Text style={[styles.sectionTitle, tabletStyles.sectionTitle]}>よく使うタグ</Text>
          {stats.topTags.map(([tag, count], index) => (
            <View key={tag} style={[styles.tagRow, tabletStyles.tagRow]}>
              <Text style={[styles.tagRank, tabletStyles.tagRank]}>{index + 1}</Text>
              <Text style={[styles.tagName, tabletStyles.tagName]}>{tag}</Text>
              <Text style={[styles.tagCount, tabletStyles.tagCount]}>{count}冊</Text>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.summaryCard, tabletStyles.summaryCard, { borderLeftColor: color }]}>
      <Text style={[styles.summaryLabel, tabletStyles.summaryLabel]}>{label}</Text>
      <Text style={[styles.summaryValue, tabletStyles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagRank: {
    width: 24,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tagName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  tagCount: {
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
