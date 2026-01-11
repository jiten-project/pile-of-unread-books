import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:mm形式
  reminderDays: number[]; // 0-6 (日-土)
  unreadReminder: boolean;
  readingReminder: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderTime: '20:00',
  reminderDays: [0, 1, 2, 3, 4, 5, 6], // 毎日
  unreadReminder: true,
  readingReminder: true,
};

// 通知のデフォルト設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 通知権限をリクエスト
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('通知はエミュレータでは動作しません');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android用のチャンネル設定
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reading-reminder', {
      name: '読書リマインダー',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  }

  return true;
}

/**
 * 通知設定を取得
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 通知設定を保存
 */
export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));

  if (settings.enabled) {
    await scheduleReadingReminder(settings);
  } else {
    await cancelAllNotifications();
  }
}

/**
 * 読書リマインダーをスケジュール
 */
export async function scheduleReadingReminder(
  settings: NotificationSettings
): Promise<void> {
  // 既存の通知をキャンセル
  await cancelAllNotifications();

  if (!settings.enabled) return;

  const [hours, minutes] = settings.reminderTime.split(':').map(Number);

  // 各曜日に通知をスケジュール
  for (const weekday of settings.reminderDays) {
    const messages = getRandomReminderMessages();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 読書の時間です',
        body: messages[Math.floor(Math.random() * messages.length)],
        data: { type: 'reading-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekday + 1, // expo-notificationsは1-7
        hour: hours,
        minute: minutes,
      },
    });
  }
}

/**
 * 積読本リマインダーを送信（即時）
 */
export async function sendUnreadBookReminder(
  bookTitle: string,
  daysSinceAdded: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📖 積読本のお知らせ',
      body: `「${bookTitle}」が追加されてから${daysSinceAdded}日経ちました。そろそろ読み始めませんか？`,
      data: { type: 'unread-reminder' },
    },
    trigger: null, // 即時送信
  });
}

/**
 * すべての通知をキャンセル
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * スケジュール済み通知を取得
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * ランダムなリマインダーメッセージを取得
 */
function getRandomReminderMessages(): string[] {
  return [
    '今日も少しだけ読書しませんか？',
    '積読本が待っています！',
    '15分だけでも読書タイムはいかがですか？',
    '読書は最高の自己投資です📚',
    '今日の読書で、少し成長しましょう！',
    '素敵な本との時間を過ごしませんか？',
    '読みかけの本、続きが気になりませんか？',
  ];
}
