/**
 * Authed area: a stack holding the tab navigator plus the screens that push
 * over it — the human-in-the-loop Confirm step (after a photo) and the shared
 * Recipe Detail (ADR-0002/0003).
 */
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

const headerOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.blue,
  headerTitleStyle: { fontFamily: fonts.sans.bold, color: colors.ink },
  contentStyle: { backgroundColor: colors.background },
} as const;

/**
 * Explicit back chevron. The default header back can no-op when a screen is
 * pushed from a nested tab (no back entry in its own navigator), so we fall back
 * to the camera tab if there's nothing to pop.
 */
function HeaderBack() {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/camera'));
  return (
    <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="back">
      <Ionicons name="chevron-back" size={26} color={colors.blue} />
    </Pressable>
  );
}

export default function AppLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="confirm" options={{ ...headerOptions, title: 'Confirm', headerLeft: () => <HeaderBack /> }} />
      <Stack.Screen name="recipe/[id]" options={{ ...headerOptions, headerTitle: '', headerLeft: () => <HeaderBack /> }} />
    </Stack>
  );
}
