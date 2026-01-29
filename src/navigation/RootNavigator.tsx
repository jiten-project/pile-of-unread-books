import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import {
  BookDetailScreen,
  BookEditScreen,
  BarcodeScanScreen,
  BookConfirmScreen,
  ISBNSearchScreen,
  TitleSearchScreen,
  NotificationSettingsScreen,
  TagManagementScreen,
  TermsOfServiceScreen,
  PrivacyPolicyScreen,
  LicensesScreen,
  DisclaimerScreen,
} from '../screens';
import { RootStackParamList } from '../types';
import { DEVICE } from '../constants/theme';

// ヘッダータイトルのサイズ（iPadでは大きく）
const HEADER_TITLE_SIZE = DEVICE.isTablet ? 22 : 17;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontSize: HEADER_TITLE_SIZE },
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{
          title: '本の詳細',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="BookEdit"
        component={BookEditScreen}
        options={{
          title: '本を編集',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="BarcodeScan"
        component={BarcodeScanScreen}
        options={{
          title: 'バーコードスキャン',
          headerBackTitle: '戻る',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="BookConfirm"
        component={BookConfirmScreen}
        options={{
          title: '書籍情報の確認',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="ISBNSearch"
        component={ISBNSearchScreen}
        options={{
          title: 'ISBN検索',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="TitleSearch"
        component={TitleSearchScreen}
        options={{
          title: 'タイトル検索',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: '通知設定',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="TagManagement"
        component={TagManagementScreen}
        options={{
          title: 'タグ管理',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          title: '利用規約',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: 'プライバシーポリシー',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="Licenses"
        component={LicensesScreen}
        options={{
          title: 'ライセンス',
          headerBackTitle: '戻る',
        }}
      />
      <Stack.Screen
        name="Disclaimer"
        component={DisclaimerScreen}
        options={{
          title: '免責事項',
          headerBackTitle: '戻る',
        }}
      />
    </Stack.Navigator>
  );
}
