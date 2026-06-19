/**
 * Authed area: a stack holding the tab navigator plus the screens that push
 * over it — the human-in-the-loop Confirm step (after a photo) and the shared
 * Recipe Detail (ADR-0002/0003). Both render their own in-screen headers
 * (back chevron + actions) to match the prototypes, so the stack header is off.
 */
import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="recipe/[id]" />
    </Stack>
  );
}
