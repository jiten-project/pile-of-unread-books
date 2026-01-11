import { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
} from '../services/notifications';
import { COLORS } from '../constants';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const TIME_OPTIONS = [
  '07:00',
  '08:00',
  '09:00',
  '12:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
];

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    reminderTime: '20:00',
    reminderDays: [0, 1, 2, 3, 4, 5, 6],
    unreadReminder: true,
    readingReminder: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await getNotificationSettings();
    setSettings(loaded);
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          '通知の許可が必要です',
          '設定アプリから通知を許可してください。',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const newSettings = { ...settings, enabled: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleDay = async (day: number) => {
    const newDays = settings.reminderDays.includes(day)
      ? settings.reminderDays.filter(d => d !== day)
      : [...settings.reminderDays, day].sort();

    const newSettings = { ...settings, reminderDays: newDays };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleSelectTime = async (time: string) => {
    const newSettings = { ...settings, reminderTime: time };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleUnreadReminder = async (value: boolean) => {
    const newSettings = { ...settings, unreadReminder: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleReadingReminder = async (value: boolean) => {
    const newSettings = { ...settings, readingReminder: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    setIsSaving(true);
    try {
      await saveNotificationSettings(newSettings);
    } catch (error) {
      Alert.alert('エラー', '設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>通知を有効にする</Text>
            <Text style={styles.rowDescription}>
              読書リマインダーを受け取ります
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: '#ddd', true: COLORS.primary }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : settings.enabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {settings.enabled && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知時間</Text>
            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeButton,
                    settings.reminderTime === time && styles.timeButtonActive,
                  ]}
                  onPress={() => handleSelectTime(time)}
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      settings.reminderTime === time && styles.timeButtonTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知する曜日</Text>
            <View style={styles.daysRow}>
              {WEEKDAYS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    settings.reminderDays.includes(index) && styles.dayButtonActive,
                  ]}
                  onPress={() => handleToggleDay(index)}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      settings.reminderDays.includes(index) && styles.dayButtonTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知タイプ</Text>

            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>積読本リマインダー</Text>
                <Text style={styles.rowDescription}>
                  長期間読んでいない本をお知らせ
                </Text>
              </View>
              <Switch
                value={settings.unreadReminder}
                onValueChange={handleToggleUnreadReminder}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : settings.unreadReminder ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>読書リマインダー</Text>
                <Text style={styles.rowDescription}>
                  定期的に読書を促すお知らせ
                </Text>
              </View>
              <Switch
                value={settings.readingReminder}
                onValueChange={handleToggleReadingReminder}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : settings.readingReminder ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </>
      )}

      <Text style={styles.note}>
        ※ 通知は端末の設定でいつでもオフにできます
      </Text>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <Text style={styles.savingText}>保存中...</Text>
        </View>
      )}
    </ScrollView>
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  rowDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 70,
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    fontSize: 16,
    color: '#666',
  },
});
