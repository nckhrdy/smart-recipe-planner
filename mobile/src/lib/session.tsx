/**
 * Session + auth (ADR-0005). Holds the Supabase session, drives Google OAuth in
 * an Expo-Go-compatible way (signInWithOAuth → in-app browser → setSession), and
 * tracks first-launch onboarding.
 *
 * Onboarding completion is a local flag for v1 (the quiz writes prefs to the
 * `profiles` table separately); it gates the first-launch quiz, not data access.
 *
 * Dev escape hatch: the sign-in screen offers a "skip" (when Supabase isn't
 * configured, or EXPO_PUBLIC_DEV_BYPASS_AUTH=true) so the shell runs before
 * Google OAuth is set up. Unlike a silent bypass, the sign-in step still
 * renders — skip is an explicit tap that persists like a session until sign-out.
 */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';

import { usePrefs } from '@/lib/prefs';
import { fetchProfile } from '@/lib/profile';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const ONBOARDED_KEY = 'srp.onboarded.v1';
const DEV_AUTHED_KEY = 'srp.dev-authed.v1';
const redirectTo = makeRedirectUri();

// Dev aid: the OAuth redirect the app expects back. Copy this exact value into
// Supabase → Authentication → URL Configuration → Redirect URLs, or auth falls
// back to the Site URL (localhost) and the browser can't return to the app.
if (__DEV__) console.log('[auth] OAuth redirectTo =', redirectTo);

/**
 * Dev-only escape hatch: when true (or when Supabase isn't configured), the
 * sign-in screen offers a "skip" so you can get past the wall before Google
 * OAuth is set up. The sign-in step still renders — skip is an explicit tap.
 * Set false in a real build to require real auth.
 */
const DEV_BYPASS_AUTH = process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';

export interface SessionContextValue {
  /** True until the initial session + onboarding flag have loaded. Keep splash up. */
  initializing: boolean;
  /** Route guard: is the user past the sign-in wall? */
  isAuthed: boolean;
  /** Route guard: signed in but hasn't finished the first-launch quiz. */
  needsOnboarding: boolean;
  session: Session | null;
  /** Whether the Supabase backend is wired up (false → dev pass-through). */
  configured: boolean;
  /** Dev escape hatch is available → the sign-in screen shows a "skip". */
  canSkipSignIn: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Dev-only: grant access without real auth. No-op unless canSkipSignIn. */
  signInAsDev: () => void;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [devAuthed, setDevAuthed] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const canSkipSignIn = !isSupabaseConfigured || DEV_BYPASS_AUTH;

  /**
   * Pull the signed-in user's prefs from the `profiles` table into the local
   * store. An existing row also means they've onboarded before (returning user /
   * new device), so skip the quiz. New users have no row → quiz runs.
   */
  const hydrateFromProfile = useCallback(async (userId: string) => {
    try {
      const prefs = await fetchProfile(userId);
      if (prefs) {
        usePrefs.getState().setPrefs(prefs);
        await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
        setOnboarded(true);
      }
    } catch (err) {
      console.warn('Could not load profile prefs', err);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDED_KEY);
        if (active && stored === 'true') setOnboarded(true);

        const dev = await AsyncStorage.getItem(DEV_AUTHED_KEY);
        if (active && dev === 'true') setDevAuthed(true);

        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (active) setSession(data.session);
          if (active && data.session?.user) await hydrateFromProfile(data.session.user.id);
        }
      } finally {
        if (active) setInitializing(false);
      }
    }

    void bootstrap();

    const listener = supabase?.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'SIGNED_IN' && nextSession?.user) void hydrateFromProfile(nextSession.user.id);
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, [hydrateFromProfile]);

  const createSessionFromUrl = useCallback(async (url: string) => {
    if (!supabase) return;
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);

    const { access_token, refresh_token } = params;
    if (!access_token || !refresh_token) return;

    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  }, []);

  // OAuth can return via a deep link (system browser / cold start) rather than the
  // in-app browser result; parse any inbound URL for tokens as a fallback.
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      void createSessionFromUrl(url).catch((err) => console.warn('Deep-link sign-in failed', err));
    });
    return () => sub.remove();
  }, [createSessionFromUrl]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      Alert.alert(
        'Backend not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env, then configure Google sign-in in Supabase.',
      );
      return;
    }

    // Web (incl. the Vercel deploy): a normal full-page redirect. The browser
    // leaves to Google and returns to our origin; the Supabase client parses the
    // tokens from the URL (detectSessionInUrl) and fires onAuthStateChange.
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
      return;
    }

    // Native: open the in-app browser, then parse the returned deep link ourselves.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;

    const result = await WebBrowser.openAuthSessionAsync(data?.url ?? '', redirectTo);
    if (result.type === 'success') {
      await createSessionFromUrl(result.url);
    }
  }, [createSessionFromUrl]);

  const signInAsDev = useCallback(() => {
    if (!canSkipSignIn) return;
    setDevAuthed(true);
    void AsyncStorage.setItem(DEV_AUTHED_KEY, 'true');
  }, [canSkipSignIn]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
    setDevAuthed(false);
    await AsyncStorage.removeItem(DEV_AUTHED_KEY);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    setOnboarded(true);
  }, []);

  // The sign-in screen renders until you're authed (real Google session or the
  // dev Skip). On web/Vercel, Google actually works (stable https redirect); the
  // Skip button (shown when canSkipSignIn) keeps reviewers unblocked. The quiz
  // then runs once (skippable) to set allergies/cuisines/diet, which drive the
  // recipe guard with or without auth.
  const isAuthed = session !== null || devAuthed;
  const needsOnboarding = isAuthed && !onboarded;

  const value: SessionContextValue = {
    initializing,
    isAuthed,
    needsOnboarding,
    session,
    configured: isSupabaseConfigured,
    canSkipSignIn,
    signInWithGoogle,
    signInAsDev,
    signOut,
    completeOnboarding,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
