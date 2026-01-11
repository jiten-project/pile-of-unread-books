import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts';

interface Option<T> {
  label: string;
  value: T;
  color?: string;
}

interface SelectInputProps<T> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  required?: boolean;
}

export default function SelectInput<T extends string>({
  label,
  options,
  value,
  onChange,
  required,
}: SelectInputProps<T>) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>
        {label}
        {required && <Text style={[styles.required, { color: colors.error }]}> *</Text>}
      </Text>
      <View style={styles.optionsContainer}>
        {options.map(option => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? option.color || colors.primary
                    : colors.surface,
                  borderColor: isSelected
                    ? option.color || colors.primary
                    : colors.border,
                },
              ]}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${option.label}${isSelected ? '、選択中' : ''}`}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? '#fff' : colors.textSecondary,
                    fontWeight: isSelected ? '600' : 'normal',
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
  },
});
