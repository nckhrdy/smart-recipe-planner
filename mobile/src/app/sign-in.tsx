/**
 * Sign-in wall (onboarding step 1). Google only for v1 (ADR-0005); no
 * passwords/forms — a brand moment + one button.
 */
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useSession } from '@/lib/session';
import { colors, radius, shadow, space } from '@/theme/tokens';

export default function SignInScreen() {
  const { signInWithGoogle, configured } = useSession();

  const onContinue = () => {
    void signInWithGoogle().catch((err: unknown) => {
      Alert.alert('Sign-in failed', err instanceof Error ? err.message : 'Please try again.');
    });
  };

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <AppText variant="overline">Smart Recipe Planner</AppText>
          <AppText variant="display">What can you make tonight?</AppText>
          <AppText variant="body" color={colors.muted}>
            Snap your ingredients. Get five recipes. No typing, no doom-scroll.
          </AppText>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.googleBtn} onPress={onContinue} accessibilityRole="button">
            <AppText variant="button">Continue with Google</AppText>
          </Pressable>
          {!configured && (
            <AppText variant="meta" style={styles.notice}>
              Backend not configured yet — add Supabase keys to enable sign-in.
            </AppText>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between', paddingVertical: space(10) },
  hero: { flex: 1, justifyContent: 'center', gap: space(3) },
  actions: { gap: space(3) },
  googleBtn: {
    backgroundColor: colors.blue,
    paddingVertical: space(4),
    borderRadius: radius.full,
    alignItems: 'center',
    ...shadow.fab,
  },
  notice: { textAlign: 'center' },
});
