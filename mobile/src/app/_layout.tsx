/**
 * Root layout: providers (React Query + Session) + brand fonts + splash + the
 * auth-gated navigator. Uses expo-router `Stack.Protected` guards (SDK 53+) so
 * the three app states — signed-out, onboarding, ready — are declarative.
 */
import { useEffect } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider, useSession } from '@/lib/session';
import { useAppFonts } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/** Hides the splash only once fonts AND the initial session have settled. */
function SplashGate({ fontsReady }: { fontsReady: boolean }) {
  const { initializing } = useSession();
  useEffect(() => {
    if (fontsReady && !initializing) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady, initializing]);
  return null;
}

function RootNavigator() {
  const { isAuthed, needsOnboarding } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthed}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthed && needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthed && !needsOnboarding}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SplashGate fontsReady={fontsLoaded || fontError !== null} />
        <RootNavigator />
        <StatusBar style="dark" />
      </SessionProvider>
    </QueryClientProvider>
  );
}
