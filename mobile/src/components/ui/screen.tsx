/**
 * Screen — the standard page wrapper: safe-area inset + warm background + the
 * design-system gutter. The strawberry backdrop will layer in here later;
 * keep cards opaque above it.
 */
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '@/theme/tokens';

export interface ScreenProps {
  children: ReactNode;
  /** Apply the horizontal screen gutter (space-5). Off for edge-to-edge screens (e.g. camera). */
  padded?: boolean;
  edges?: readonly Edge[];
  style?: ViewStyle;
}

export function Screen({ children, padded = true, edges = ['top', 'bottom'], style }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.safe}>
      <View style={[styles.body, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  padded: { paddingHorizontal: space(5) },
});
