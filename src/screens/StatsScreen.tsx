import { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useBookStore } from '../store';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../constants';
import { BookStatus, Priority } from '../types';
import { EmptyState } from '../components';

const screenWidth = Dimensions.get('window').width;

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
    fontSize: 12,
  },
};

export default function StatsScreen() {
  const { books } = useBookStore();

  const stats = useMemo(() => {
    // ステータス別集計
    const statusCounts: Record<BookStatus, number> = {
      unread: 0,
      reading: 0,
      paused: 0,
      completed: 0,
    };
    books.forEach(book => {
      statusCounts[book.status]++;
    });

    // 優先度別集計
    const priorityCounts: Record<Priority, number> = {
      high: 0,
      medium: 0,
      low: 0,
    };
    books.forEach(book => {
      priorityCounts[book.priority]++;
    });

    // 月別読了数（過去6ヶ月）
    const monthlyCompleted: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = books.filter(book => {
        if (!book.completedDate) return false;
        const completed = new Date(book.completedDate);
        return completed >= date && completed <= monthEnd;
      }).length;
      monthlyCompleted.push({
        month: `${date.getMonth() + 1}月`,
        count,
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

    // 購入金額集計
    const totalSpent = books.reduce((sum, book) => sum + (book.purchasePrice || 0), 0);
    const unreadSpent = books
      .filter(b => b.status === 'unread')
      .reduce((sum, book) => sum + (book.purchasePrice || 0), 0);

    // 平均積読期間
    const unreadBooks = books.filter(b => b.status === 'unread');
    let avgUnreadDays = 0;
    if (unreadBooks.length > 0) {
      const totalDays = unreadBooks.reduce((sum, book) => {
        const days = Math.floor(
          (now.getTime() - new Date(book.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgUnreadDays = Math.round(totalDays / unreadBooks.length);
    }

    return {
      total: books.length,
      statusCounts,
      priorityCounts,
      monthlyCompleted,
      topTags,
      totalSpent,
      unreadSpent,
      avgUnreadDays,
    };
  }, [books]);

  const pieData = Object.entries(stats.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status as BookStatus],
      count,
      color: STATUS_COLORS[status as BookStatus],
      legendFontColor: '#333',
      legendFontSize: 12,
    }));

  const barData = {
    labels: stats.monthlyCompleted.map(m => m.month),
    datasets: [
      {
        data: stats.monthlyCompleted.map(m => m.count),
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryRow}>
        <SummaryCard label="総登録数" value={`${stats.total}冊`} color="#007AFF" />
        <SummaryCard
          label="読了率"
          value={`${Math.round((stats.statusCounts.completed / stats.total) * 100)}%`}
          color="#4CAF50"
        />
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard label="平均積読期間" value={`${stats.avgUnreadDays}日`} color="#FF9800" />
        <SummaryCard
          label="積読金額"
          value={`¥${stats.unreadSpent.toLocaleString()}`}
          color="#F44336"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ステータス別</Text>
        {pieData.length > 0 && (
          <PieChart
            data={pieData}
            width={screenWidth - 32}
            height={200}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>月別読了数（過去6ヶ月）</Text>
        <BarChart
          data={barData}
          width={screenWidth - 32}
          height={220}
          yAxisLabel=""
          yAxisSuffix="冊"
          chartConfig={{
            ...chartConfig,
            barPercentage: 0.6,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
          fromZero
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>優先度別</Text>
        <View style={styles.priorityGrid}>
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map(priority => (
            <View key={priority} style={styles.priorityItem}>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[priority] }]} />
              <Text style={styles.priorityLabel}>{PRIORITY_LABELS[priority]}</Text>
              <Text style={styles.priorityCount}>{stats.priorityCounts[priority]}冊</Text>
            </View>
          ))}
        </View>
      </View>

      {stats.topTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>よく使うタグ</Text>
          {stats.topTags.map(([tag, count], index) => (
            <View key={tag} style={styles.tagRow}>
              <Text style={styles.tagRank}>{index + 1}</Text>
              <Text style={styles.tagName}>{tag}</Text>
              <Text style={styles.tagCount}>{count}冊</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>購入金額</Text>
        <View style={styles.spendingRow}>
          <Text style={styles.spendingLabel}>総購入金額</Text>
          <Text style={styles.spendingValue}>¥{stats.totalSpent.toLocaleString()}</Text>
        </View>
        <View style={styles.spendingRow}>
          <Text style={styles.spendingLabel}>未読本の金額</Text>
          <Text style={[styles.spendingValue, { color: '#F44336' }]}>
            ¥{stats.unreadSpent.toLocaleString()}
          </Text>
        </View>
      </View>
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
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
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
  priorityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priorityItem: {
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#666',
  },
  priorityCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  spendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  spendingLabel: {
    fontSize: 14,
    color: '#666',
  },
  spendingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
