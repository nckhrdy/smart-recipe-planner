/**
 * Session + auth (ADR-0005). Holds the Supabase session, drives Google OAuth in
 * an Expo-Go-compatible way (signInWithOAuth → in-app browser → setSession), and
 * tracks first-launch onboarding.
 *
 * Onboarding completion is a local flag for v1 (the quiz writes prefs to the
 * `profiles` table separately); it gates the first-launch quiz, not data access.
 *
 * Dev pass-through: when Supabase isn't configured, `isAuthed` is forced true so
 * the shell runs on-device before the backend exists. Real gating engages the
 * moment EXPO_PUBLIC_SUPABASE_* are set.
 */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const ONBOARDED_KEY = 'srp.onboarded.v1';
const redirectTo = makeRedirectUri();

/**
 * Dev-only escape hatch: skip the sign-in wall even when Supabase IS configured.
 * Lets us wire the real DB before Google OAuth is set up. Remove (or set false)
 * once sign-in works. Never enable in a real build.
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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const devBypass = !isSupabaseConfigured || DEV_BYPASS_AUTH;

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const stored = await AsyncStorage.getItem(ONBOARDED_KEY);
        if (active && stored === 'true') setOnboarded(true);

        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (active) setSession(data.session);
        }
      } finally {
        if (active) setInitializing(false);
      }
    }

    void bootstrap();

    const listener = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  const createSessionFromUrl = useCallback(async (url: string) => {
    if (!supabase) return;
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) throw new Error(errorCode);

    const { access_token, refresh_token } = params;
    if (!access_token || !refresh_token) return;

    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      Alert.alert(
        'Backend not configured',
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env, then configure Google sign-in in Supabase.',
      );
      return;
    }

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

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    setOnboarded(true);
  }, []);

  const isAuthed = devBypass || session !== null;
  const needsOnboarding = !devBypass && isAuthed && !onboarded;

  const value: SessionContextValue = {
    initializing,
    isAuthed,
    needsOnboarding,
    session,
    configured: isSupabaseConfigured,
    signInWithGoogle,
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
