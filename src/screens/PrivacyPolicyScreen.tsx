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
        最終更新日: 2026年1月27日
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
          本アプリは、以下の情報をユーザーのデバイス内に保存します。{'\n\n'}
          • 書籍情報（タイトル、著者、ISBN等）{'\n'}
          • 読書状況（ステータス、読書日時等）{'\n'}
          • アプリ設定（テーマ、通知設定等）{'\n\n'}
          クラウド同期を有効にした場合、上記の書籍情報はApple IDに紐づいたクラウドサーバー（Supabase）にも保存されます。これにより、複数デバイス間でデータを同期できます。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          クラウド同期機能（オプション）
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          バージョン1.1.0より、クラウド同期機能が追加されました。この機能は任意であり、サインインしない場合はデータはデバイス内にのみ保存されます。{'\n\n'}
          クラウド同期を有効にした場合：{'\n'}
          • Apple ID（Sign in with Apple）を使用して認証を行います{'\n'}
          • 書籍データは暗号化された通信（HTTPS）でクラウドサーバーに送信されます{'\n'}
          • データはSupabase（クラウドデータベースサービス）に保存されます{'\n'}
          • データはユーザーのApple IDに紐づけられ、本人のみがアクセスできます{'\n'}
          • クラウドに同期できる書籍は現在50冊までです。50冊を超える分はデバイス内にのみ保存されます{'\n\n'}
          メールアドレスについて：Apple IDの「メールを非公開」機能を使用した場合、実際のメールアドレスは本アプリに共有されません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          外部サービスとの連携
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          【書籍情報の取得】{'\n'}
          • OpenBD API（日本の書籍情報）{'\n'}
          • Google Books API（海外の書籍情報）{'\n'}
          この際、ISBN番号のみが送信され、個人を特定する情報は送信されません。{'\n\n'}
          【認証・データ保存（クラウド同期有効時のみ）】{'\n'}
          • Sign in with Apple（Apple社の認証サービス）{'\n'}
          • Supabase（クラウドデータベース）
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
          【ローカルデータ】{'\n'}
          • デバイス内のデータは、アプリをアンインストールすると削除されます{'\n'}
          • 設定画面の「すべてのデータを削除」機能を使用すると、ローカルデータが削除されます{'\n'}
          • この操作ではクラウドデータは削除されません{'\n\n'}
          【クラウドデータ（クラウド同期有効時）】{'\n'}
          • サインアウトしてもクラウドデータは保持されます（再サインイン時に復元可能）{'\n'}
          • 「すべてのデータを削除」実行時に「クラウドも削除」を選択すると、クラウドデータも削除されます{'\n'}
          • 「ローカルのみ」を選択した場合、クラウドデータは保持されます{'\n'}
          • アカウント削除を行うと、関連するクラウドデータもすべて削除されます
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          データのセキュリティ
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          クラウド同期機能では、以下のセキュリティ対策を実施しています。{'\n\n'}
          • すべての通信はHTTPS（TLS暗号化）で保護されています{'\n'}
          • Row Level Security（RLS）により、ユーザーは自分のデータにのみアクセスできます{'\n'}
          • 認証にはAppleの安全な認証システムを使用しています
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          第三者への情報提供
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは、ユーザーの個人情報を第三者に提供、販売、共有することはありません。ただし、法令に基づく開示要請があった場合は、この限りではありません。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          お子様のプライバシー
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          本アプリは年齢制限を設けていません。クラウド同期機能を使用しない場合、個人情報は収集されないため、お子様も安心してご利用いただけます。クラウド同期機能のご利用には、Apple IDが必要です。
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
