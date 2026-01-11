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
        最終更新日: 2024年12月30日
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
          1. 本アプリで登録されたデータは、ユーザーのデバイス内にのみ保存されます。{'\n'}
          2. データのバックアップおよび管理はユーザー自身の責任において行ってください。{'\n'}
          3. アプリの削除やデバイスの変更によりデータが消失した場合、復元はできません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第4条（外部サービスの利用）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 本アプリは、書籍情報の取得にGoogle Books APIを利用しています。{'\n'}
          2. Google Books APIを通じて取得される書籍情報（タイトル、著者、表紙画像等）の著作権は、各権利者に帰属します。{'\n'}
          3. 表紙画像はGoogleのサーバーから直接取得・表示されるものであり、本アプリ内に保存・再配布されることはありません。{'\n'}
          4. 外部サービスの仕様変更や停止により、一部機能が利用できなくなる場合があります。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第5条（知的財産権）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 本アプリに関する著作権、商標権その他の知的財産権は、開発者または正当な権利者に帰属します。{'\n'}
          2. 書籍の表紙画像、タイトル、著者名等の書籍情報に関する権利は、各出版社および著作権者に帰属します。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第6条（禁止事項）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ユーザーは以下の行為を行ってはなりません。{'\n\n'}
          • 本アプリの改変、リバースエンジニアリング{'\n'}
          • 本アプリを利用した違法行為{'\n'}
          • 本アプリの再配布または販売{'\n'}
          • その他、開発者が不適切と判断する行為
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第7条（免責事項）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          1. 開発者は、本アプリの利用により生じた損害について一切の責任を負いません。{'\n'}
          2. 本アプリの動作保証、特定目的への適合性について保証しません。{'\n'}
          3. 本アプリのサービス内容は予告なく変更または終了する場合があります。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第8条（規約の変更）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          開発者は、必要に応じて本規約を変更することができます。変更後の規約は、本アプリ内での公開をもって効力を生じるものとします。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第9条（準拠法）
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
