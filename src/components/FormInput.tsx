import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../contexts';
import { DEVICE } from '../constants';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormInput({ label, error, required, style, ...props }: FormInputProps) {
  const { colors } = useTheme();

  // iPad用の拡大スタイル
  const tabletStyles = DEVICE.isTablet ? {
    container: { marginBottom: 20 },
    label: { fontSize: 18, marginBottom: 10 },
    input: { paddingHorizontal: 16, paddingVertical: 16, fontSize: 20, minHeight: 60, borderRadius: 12 },
    errorText: { fontSize: 16, marginTop: 6 },
  } : {};

  return (
    <View style={[styles.container, tabletStyles.container]}>
      <Text style={[styles.label, { color: colors.textPrimary }, tabletStyles.label]}>
        {label}
        {required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
          },
          tabletStyles.input,
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel={label}
        {...props}
      />
      {error && <Text style={[styles.errorText, { color: colors.error }, tabletStyles.errorText]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {},
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
