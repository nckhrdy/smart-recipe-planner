/**
 * Screen — the standard page wrapper: safe-area inset + warm background + the
 * design-system gutter. The strawberry backdrop (cobalt doodle on cream, see
 * design-tokens §Backdrop) sits full-bleed behind the content; keep cards
 * opaque above it. `backdrop={false}` for immersive/dark screens (camera).
 */
import { type ReactNode } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, space } from '@/theme/tokens';
import backdrop from '@/assets/recipe-background.png';

export interface ScreenProps {
  children: ReactNode;
  /** Apply the horizontal screen gutter (space-5). Off for edge-to-edge screens. */
  padded?: boolean;
  /** Layer the strawberry backdrop behind content. Off for dark/immersive screens. */
  backdrop?: boolean;
  edges?: readonly Edge[];
  style?: ViewStyle;
}

export function Screen({
  children,
  padded = true,
  backdrop: showBackdrop = true,
  edges = ['top', 'bottom'],
  style,
}: ScreenProps) {
  return (
    <View style={styles.root}>
      {showBackdrop ? (
        <Image source={backdrop} style={styles.backdrop} contentFit="cover" contentPosition="top" />
      ) : null}
      <SafeAreaView edges={edges} style={styles.safe}>
        <View style={[styles.body, padded && styles.padded, style]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backdrop: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1 },
  body: { flex: 1 },
  padded: { paddingHorizontal: space(5) },
});
