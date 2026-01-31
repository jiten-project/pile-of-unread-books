import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { BookInfo } from './book';

// Root Stack の画面パラメータ
export type RootStackParamList = {
  Main: undefined;
  BookDetail: { bookId: string };
  BookEdit: { bookId: string };
  BarcodeScan: undefined;
  BookConfirm: { bookInfo: BookInfo };
  ISBNSearch: undefined;
  TitleSearch: undefined;
  TagManagement: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  Licenses: undefined;
  Disclaimer: undefined;
};

// Tab Navigator の画面パラメータ
export type TabParamList = {
  Home: undefined;
  Bookshelf: undefined;
  AddBook: { isbn?: string } | undefined;
  Stats: undefined;
  Settings: undefined;
};

// Main画面経由でのナビゲーション用パラメータ
export type MainScreenParams = {
  screen: keyof TabParamList;
  params?: TabParamList[keyof TabParamList];
};

// Root Stack のナビゲーション型
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Tab と Root Stack を組み合わせたナビゲーション型
export type AppNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// 各画面の Route 型
export type BookDetailRouteProp = RouteProp<RootStackParamList, 'BookDetail'>;
export type BookEditRouteProp = RouteProp<RootStackParamList, 'BookEdit'>;
export type BookConfirmRouteProp = RouteProp<RootStackParamList, 'BookConfirm'>;
