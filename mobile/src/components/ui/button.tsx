import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { colors, radius, shadow, space } from '@/theme/tokens';

type Variant = 'primary' | 'cta' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  const fg = variant === 'ghost' ? colors.blue : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'cta' && styles.cta,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <AppText variant="button" color={fg}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: space(4), paddingHorizontal: space(5), borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  primary: { backgroundColor: colors.blue, ...shadow.fab },
  cta: { backgroundColor: colors.orange, ...shadow.cta },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.blue },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
});
