import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts';

export default function DisclaimerScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>免責事項</Text>
      <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
        最終更新日: 2026年1月29日
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          1. 一般的な免責
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリケーション「積読本管理」（以下「本アプリ」）は、現状有姿（AS IS）で提供されます。開発者は、明示または黙示を問わず、本アプリの動作、正確性、信頼性、特定目的への適合性について、いかなる保証も行いません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          2. データの保存と損失
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリに保存されたデータは、デフォルトではユーザーのデバイス内にのみ存在します。クラウド同期機能を有効にした場合は、データはクラウドサーバー（Supabase）にも保存されます。{'\n\n'}
          【ローカルデータ】{'\n'}
          以下の場合にデータが失われる可能性があります。{'\n'}
          • アプリのアンインストール{'\n'}
          • デバイスの初期化または故障{'\n'}
          • OSのアップデートによる影響{'\n'}
          • 「すべてのデータを削除」機能の実行{'\n'}
          • その他の予期しない技術的問題{'\n\n'}
          【クラウドデータ（クラウド同期有効時）】{'\n'}
          • クラウドに同期できる書籍は現在50冊までです。50冊を超える分はデバイス内にのみ保存されます{'\n'}
          • サインアウトしてもクラウドデータは保持されます{'\n'}
          • 「すべてのデータを削除」実行時に「クラウドも削除」を選択するとクラウドデータも削除されます{'\n'}
          • 「ローカルのみ」を選択した場合、クラウドデータは保持されます{'\n\n'}
          開発者は、いかなる理由によるデータの損失についても責任を負いません。クラウド同期を有効にするか、定期的にエクスポート機能を使用してバックアップすることをお勧めします。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          3. 書籍情報の正確性
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリはOpenBD APIおよびGoogle Books APIを通じて書籍情報を取得する場合があります。取得された情報の正確性、完全性、最新性について、開発者は保証しません。{'\n\n'}
          【自動取得される情報の制限】{'\n'}
          以下の情報は、API提供元のデータに依存するため、実際の書籍と異なる場合があります。{'\n'}
          • ページ数：データがない、または実際と異なる数値が表示される場合があります{'\n'}
          • 定価：改定前の旧価格が表示される、またはデータがない場合があります{'\n'}
          • その他の書籍情報（発売日、出版社、説明文等）{'\n\n'}
          書籍情報に誤りがある場合は、登録後にユーザー自身で編集・修正してください。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          4. サービスの中断・終了
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          開発者は、以下の場合において、事前の通知なく本アプリの提供を中断または終了することがあります。{'\n\n'}
          • システムの保守・点検を行う場合{'\n'}
          • 技術的な問題が発生した場合{'\n'}
          • 外部サービス（API、認証、クラウド同期等）の提供が終了した場合{'\n'}
          • その他、開発者が必要と判断した場合{'\n\n'}
          クラウド同期サービスを終了する場合は、事前にユーザーに通知し、データのエクスポート期間を設けます。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          5. 損害の免責
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリの使用または使用不能により生じた以下を含むいかなる損害についても、開発者は責任を負いません。{'\n\n'}
          • 直接的または間接的な損害{'\n'}
          • 特別損害または付随的損害{'\n'}
          • 逸失利益{'\n'}
          • データの損失または破損{'\n'}
          • 第三者からの請求に基づく損害
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          6. 第三者サービス
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは以下の第三者サービスを使用しています。{'\n\n'}
          【書籍情報の取得】{'\n'}
          • OpenBD API（日本の書籍情報）{'\n'}
          • Google Books API（海外の書籍情報）{'\n\n'}
          【クラウド同期機能（オプション）】{'\n'}
          • Sign in with Apple（Apple社の認証サービス）{'\n'}
          • Supabase（クラウドデータベース）{'\n\n'}
          これらのサービスは各提供元の利用規約に従って提供されており、サービスの変更や停止により本アプリの一部機能が利用できなくなる可能性があります。開発者は、これらの外部サービスの障害や仕様変更による影響について責任を負いません。
        </Text>
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          7. 免責事項の変更
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本免責事項は、必要に応じて変更される場合があります。変更後も本アプリを継続して使用することにより、変更後の免責事項に同意したものとみなされます。
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
});
