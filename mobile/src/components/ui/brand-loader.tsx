/**
 * BrandLoader — the waiting state with personality: the strawberry icon and the
 * Always Hungry wordmark hop in place (a gentle parallax bounce) while a line of
 * status text cycles underneath. Used full-bleed for the scan and recipe-
 * generation waits, and `compact` (inline, no flex) where a refresh swaps the
 * recipe cards out for a beat. Animations stop on unmount.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { StrawberryDoodle } from '@/components/ui/doodles';
import { AppText } from '@/components/ui/text';
import { Wordmark } from '@/components/ui/wordmark';
import { space } from '@/theme/tokens';

// The native driver animates transforms/opacity off the JS thread; react-native-web
// has no native layer, so fall back to the JS driver there to avoid a warning.
const USE_NATIVE = Platform.OS !== 'web';
const CYCLE_MS = 1900;

/** Default status lines for each wait, kept here so screens don't drift apart. */
export const SCAN_MESSAGES = [
  'Looking at your photos…',
  'Spotting ingredients…',
  'Reading shapes and labels…',
  'Almost there…',
];
export const GENERATE_MESSAGES = [
  'Cooking up five ideas…',
  'Checking what you have…',
  'Balancing the flavors…',
  'Plating your options…',
];
export const REFRESH_MESSAGES = [
  'Finding five fresh ideas…',
  'Skipping what you saw…',
  'Mixing it up…',
];

export interface BrandLoaderProps {
  /** Status lines shown one at a time, fading between each. */
  messages: string[];
  /** Inline, smaller variant (e.g. replacing cards during a refresh). */
  compact?: boolean;
}

export function BrandLoader({ messages, compact = false }: BrandLoaderProps) {
  const bounce = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [index, setIndex] = useState(0);

  // Continuous hop: spring up, settle down with a bounce.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE }),
        Animated.timing(bounce, { toValue: 0, duration: 620, easing: Easing.bounce, useNativeDriver: USE_NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  // Cross-fade the status line on an interval.
  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: USE_NATIVE }).start(() => {
        setIndex((i) => (i + 1) % messages.length);
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: USE_NATIVE }).start();
      });
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [messages.length, fade]);

  const amp = compact ? 9 : 14;
  const strawberryY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -amp] });
  const wordmarkY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -amp * 0.5] }); // softer parallax

  return (
    <View style={compact ? styles.compact : styles.full}>
      <Animated.View style={{ transform: [{ translateY: strawberryY }] }}>
        <StrawberryDoodle size={compact ? 54 : 88} />
      </Animated.View>
      <Animated.View style={[styles.wordmark, { transform: [{ translateY: wordmarkY }] }]}>
        <Wordmark width={compact ? 150 : 214} />
      </Animated.View>
      <Animated.View style={[styles.msgWrap, { opacity: fade }]}>
        <AppText variant={compact ? 'meta' : 'sectionHero'} style={styles.msg}>
          {messages[index]}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(2) },
  compact: { alignItems: 'center', justifyContent: 'center', gap: space(2), paddingVertical: space(9) },
  wordmark: { marginTop: space(3) },
  msgWrap: { marginTop: space(4), minHeight: 26, alignItems: 'center', justifyContent: 'center' },
  msg: { textAlign: 'center' },
});
