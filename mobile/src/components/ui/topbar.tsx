/**
 * Topbar — the "Always Hungry" wordmark (Fredoka, cobalt) + a tappable avatar
 * that jumps to Profile. Used on the two primary tabs that show the brand
 * (Home, Recipe List), per the prototypes.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { colors, fonts, radius, space } from '@/theme/tokens';

export const WORDMARK = 'Always Hungry';

export interface TopbarProps {
  /** Single uppercase initial shown in the avatar. */
  initial?: string;
}

export function Topbar({ initial = 'N' }: TopbarProps) {
  return (
    <View style={styles.bar}>
      <AppText style={styles.wordmark}>{WORDMARK}</AppText>
      <Pressable
        onPress={() => router.push('/profile')}
        accessibilityRole="button"
        accessibilityLabel="profile"
        style={styles.avatar}>
        <AppText style={styles.initial}>{initial}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space(2), paddingBottom: space(1) },
  wordmark: { fontFamily: fonts.display.semibold, fontSize: 23, color: colors.blue, letterSpacing: 0.2 },
  avatar: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.display.semibold, fontSize: 16, color: colors.white },
});
