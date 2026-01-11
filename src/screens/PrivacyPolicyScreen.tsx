import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        プライバシーポリシー
      </Text>
      <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
        最終更新日: 2024年12月30日
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          はじめに
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリケーション「積読本管理」（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本プライバシーポリシーでは、本アプリにおけるデータの取り扱いについて説明します。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          収集する情報
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは、以下の情報をユーザーのデバイス内にのみ保存します。{'\n\n'}
          • 書籍情報（タイトル、著者、ISBN等）{'\n'}
          • 読書状況（ステータス、読書日時等）{'\n'}
          • アプリ設定（テーマ、通知設定等）{'\n\n'}
          これらの情報は外部サーバーには送信されません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          外部サービスとの連携
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは、書籍情報の取得のためにGoogle Books APIを利用する場合があります。この際、ISBN番号のみが送信され、個人を特定する情報は送信されません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          カメラの使用
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは、バーコードスキャン機能のためにカメラへのアクセスを要求する場合があります。カメラで取得した画像は、バーコード読み取りのためにのみ使用され、保存や外部送信は行われません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          通知
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは、読書リマインダー機能のためにローカル通知を使用する場合があります。通知はデバイス内で完結し、外部サーバーとの通信は行われません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          データの保存と削除
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          すべてのデータはユーザーのデバイス内にのみ保存されます。アプリをアンインストールすると、保存されたデータはすべて削除されます。また、設定画面からデータを手動で削除することも可能です。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第三者への情報提供
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは、ユーザーの個人情報を第三者に提供、販売、共有することはありません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          お子様のプライバシー
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは年齢制限を設けておらず、個人情報を収集しないため、お子様も安心してご利用いただけます。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          プライバシーポリシーの変更
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本プライバシーポリシーは、必要に応じて変更される場合があります。変更があった場合は、本アプリ内で通知します。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          お問い合わせ
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          プライバシーに関するご質問やご懸念がある場合は、アプリストアのレビュー機能またはサポートページからお問い合わせください。
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
