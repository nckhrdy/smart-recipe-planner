/**
 * Sign-in wall (onboarding step 1). Google only for v1 (ADR-0005); no
 * passwords/forms — a brand moment (strawberry + wordmark + tagline) and one
 * button. Matches the sign-in prototype.
 */
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { StrawberryDoodle } from '@/components/ui/doodles';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { WORDMARK } from '@/components/ui/topbar';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, space } from '@/theme/tokens';

function GoogleLogo() {
  return (
    <Svg width={19} height={19} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.5 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.3 5.2C41.4 36.1 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </Svg>
  );
}

export default function SignInScreen() {
  const { signInWithGoogle, signInAsDev, canSkipSignIn, configured } = useSession();
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      Alert.alert('Sign-in failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <StrawberryDoodle size={92} />
          <AppText style={styles.mark}>{WORDMARK}</AppText>
          <AppText style={styles.tag}>Cook with what you&apos;ve already got.</AppText>
        </View>

        <View style={styles.auth}>
          <Pressable
            style={({ pressed }) => [styles.googleBtn, (pressed || busy) && styles.pressed]}
            onPress={() => void onContinue()}
            disabled={busy}
            accessibilityRole="button">
            {busy ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <>
                <GoogleLogo />
                <AppText style={styles.googleText}>Continue with Google</AppText>
              </>
            )}
          </Pressable>
          {configured ? (
            <AppText variant="meta" style={styles.legal}>
              By continuing you agree to our Terms & Privacy Policy.
            </AppText>
          ) : (
            <AppText variant="meta" style={styles.legal}>
              Backend not configured yet — add Supabase keys to enable sign-in.
            </AppText>
          )}

          {canSkipSignIn ? (
            <Pressable onPress={signInAsDev} accessibilityRole="button" hitSlop={8} style={styles.devSkip}>
              <AppText style={styles.devSkipText}>Skip for now (dev)</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingBottom: space(6) },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(2) },
  mark: { fontFamily: fonts.display.semibold, fontSize: 46, lineHeight: 48, color: colors.blue, textAlign: 'center', marginTop: space(3) },
  tag: { fontFamily: fonts.sans.medium, fontSize: 15.5, lineHeight: 22, color: colors.ink, textAlign: 'center', maxWidth: 240, marginTop: space(2) },

  auth: { gap: space(3) },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(3), backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: space(4) },
  pressed: { opacity: 0.9 },
  googleText: { fontFamily: fonts.sans.bold, fontSize: 15, color: colors.ink },
  legal: { textAlign: 'center' },
  devSkip: { alignSelf: 'center', paddingVertical: space(2) },
  devSkipText: { fontFamily: fonts.sans.bold, fontSize: 13.5, color: colors.muted },
});
