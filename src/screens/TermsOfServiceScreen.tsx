import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts';

export default function TermsOfServiceScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>利用規約</Text>
      <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
        最終更新日: 2026年1月25日
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第1条（適用）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本規約は、本アプリケーション「積読本管理」（以下「本アプリ」）の利用に関する条件を定めるものです。ユーザーは本アプリをダウンロードまたは利用することにより、本規約に同意したものとみなされます。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第2条（利用条件）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 本アプリは個人利用を目的として提供されます。{'\n'}
          2. ユーザーは自己の責任において本アプリを利用するものとします。{'\n'}
          3. 本アプリの利用にあたり、法令および公序良俗に反する行為を行ってはなりません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第3条（データの取り扱い）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 本アプリで登録されたデータは、デフォルトではユーザーのデバイス内にのみ保存されます。{'\n'}
          2. クラウド同期機能を有効にした場合、データはクラウドサーバー（Supabase）にも保存されます。{'\n'}
          3. データのバックアップおよび管理はユーザー自身の責任において行ってください。{'\n'}
          4. アプリの削除やデバイスの変更によりローカルデータが消失した場合でも、クラウド同期を有効にしていれば、再サインインによりデータを復元できます。{'\n'}
          5. クラウド同期を使用していない場合、データの復元はできません。{'\n'}
          6. 設定画面の「すべてのデータを削除」機能では、ローカルデータのみ削除するか、クラウドデータも一緒に削除するかを選択できます。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第4条（クラウド同期機能）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. クラウド同期機能は任意のオプション機能です。利用にはApple IDでのサインインが必要です。{'\n'}
          2. クラウド同期機能は無料で提供されますが、将来的に変更される可能性があります。{'\n'}
          3. クラウドサービスの障害やメンテナンスにより、一時的に同期機能が利用できない場合があります。{'\n'}
          4. クラウドに保存されたデータは、ユーザーのApple IDに紐づけられ、本人のみがアクセスできます。{'\n'}
          5. サインアウト後もクラウドデータは保持されます。完全削除を希望する場合はサポートまでお問い合わせください。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第5条（外部サービスの利用）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 本アプリは、書籍情報の取得にOpenBD APIおよびGoogle Books APIを利用しています。{'\n'}
          2. 認証にはApple社のSign in with Appleを利用しています。{'\n'}
          3. クラウドデータの保存にはSupabaseを利用しています。{'\n'}
          4. 各APIを通じて取得される書籍情報（タイトル、著者、表紙画像等）の著作権は、各権利者に帰属します。{'\n'}
          5. 表紙画像は外部サーバーから直接取得・表示されるものであり、本アプリ内に保存・再配布されることはありません。{'\n'}
          6. 外部サービスの仕様変更や停止により、一部機能が利用できなくなる場合があります。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第6条（知的財産権）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 本アプリに関する著作権、商標権その他の知的財産権は、開発者または正当な権利者に帰属します。{'\n'}
          2. 書籍の表紙画像、タイトル、著者名等の書籍情報に関する権利は、各出版社および著作権者に帰属します。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第7条（禁止事項）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ユーザーは以下の行為を行ってはなりません。{'\n\n'}
          • 本アプリの改変、リバースエンジニアリング{'\n'}
          • 本アプリを利用した違法行為{'\n'}
          • 本アプリの再配布または販売{'\n'}
          • クラウドサービスへの不正アクセスまたは攻撃{'\n'}
          • 他のユーザーのアカウントへの不正アクセス{'\n'}
          • その他、開発者が不適切と判断する行為
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第8条（免責事項）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 開発者は、本アプリの利用により生じた損害について一切の責任を負いません。{'\n'}
          2. 本アプリの動作保証、特定目的への適合性について保証しません。{'\n'}
          3. クラウドサービスの障害、データの消失、同期の遅延等について、開発者は責任を負いません。{'\n'}
          4. 本アプリのサービス内容は予告なく変更または終了する場合があります。{'\n'}
          5. 外部サービス（Apple、Supabase等）の障害や仕様変更による影響について、開発者は責任を負いません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第9条（サービスの変更・終了）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 開発者は、事前の通知なく本アプリの機能を変更、追加、または削除することができます。{'\n'}
          2. クラウド同期サービスを終了する場合は、事前にユーザーに通知し、データのエクスポート期間を設けます。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第10条（規約の変更）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          開発者は、必要に応じて本規約を変更することができます。変更後の規約は、本アプリ内での公開をもって効力を生じるものとします。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第11条（準拠法）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本規約の解釈および適用は、日本法に準拠するものとします。
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
