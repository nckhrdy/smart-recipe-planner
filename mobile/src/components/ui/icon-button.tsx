/**
 * IconButton — the circular control used in custom screen headers (back, save).
 * Surface circle + hairline border by default; `active` fills cobalt (the saved
 * state on Recipe Detail). Caller supplies the icon and picks its color.
 */
import { type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme/tokens';

export interface IconButtonProps {
  children: ReactNode;
  onPress: () => void;
  active?: boolean;
  accessibilityLabel: string;
}

export function IconButton({ children, onPress, active = false, accessibilityLabel }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.btn, active && styles.active, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.blue, borderColor: colors.blue },
  pressed: { opacity: 0.9 },
});
