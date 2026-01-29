import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts';
import { DEVICE } from '../constants';

interface DateInputProps {
  label: string;
  value: string; // YYYY-MM-DD形式
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function DateInput({
  label,
  value,
  onChange,
  placeholder = '日付を選択',
  required = false,
}: DateInputProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  // iPad用の拡大スタイル
  const tabletStyles = DEVICE.isTablet ? {
    container: { marginBottom: 20 },
    label: { fontSize: 18, marginBottom: 10 },
    input: { paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12 },
    inputText: { fontSize: 20 },
    modalHeader: { padding: 20 },
    modalTitle: { fontSize: 20 },
    modalButton: { fontSize: 20 },
    picker: { height: 260 },
  } : {};

  // YYYY-MM-DD形式からDateオブジェクトに変換
  // 不完全な形式（YYYY-MM や YYYY のみ）にも対応
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-').map(Number);
    const year = parts[0] || new Date().getFullYear();
    const month = (parts[1] || 1) - 1; // 月は0始まり、デフォルトは1月
    const day = parts[2] || 1; // 日がない場合は1日

    // 無効な日付の場合は現在日付を返す
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  };

  // DateオブジェクトからYYYY-MM-DD形式に変換
  const formatDateValue = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 表示用の日付フォーマット
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = parseDate(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      onChange(formatDateValue(selectedDate));
    }
  };

  const handleClear = () => {
    onChange('');
    setShowPicker(false);
  };

  const handleConfirm = () => {
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, tabletStyles.container]}>
      <Text style={[styles.label, { color: colors.textSecondary }, tabletStyles.label]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
          tabletStyles.input,
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text
          style={[
            styles.inputText,
            {
              color: value ? colors.textPrimary : colors.textTertiary,
            },
            tabletStyles.inputText,
          ]}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                  tabletStyles.modalHeader,
                ]}
              >
                <TouchableOpacity onPress={handleClear}>
                  <Text style={[styles.modalButton, { color: colors.error }, tabletStyles.modalButton]}>
                    クリア
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }, tabletStyles.modalTitle]}>
                  {label}
                </Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={[styles.modalButton, { color: colors.primary }, tabletStyles.modalButton]}>
                    完了
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={parseDate(value)}
                mode="date"
                display="spinner"
                onChange={handleChange}
                locale="ja-JP"
                style={[styles.picker, tabletStyles.picker]}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={parseDate(value)}
            mode="date"
            display="default"
            onChange={handleChange}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  inputText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  picker: {
    height: 200,
  },
});
