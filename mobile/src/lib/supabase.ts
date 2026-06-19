/**
 * Supabase client (ADR-0005). The app talks to Supabase for auth + RLS-gated
 * CRUD; the Anthropic key never lives here — only in the Edge Function.
 *
 * Config comes from EXPO_PUBLIC_* env (see .env.example). The anon key is safe
 * in the client because every table is guarded by Row-Level Security.
 *
 * When the project isn't configured yet, `supabase` is null and
 * `isSupabaseConfigured` is false — the app falls back to a dev pass-through so
 * the shell still runs (see lib/session). Validate at the boundary: consumers
 * must null-check or use `requireSupabase()`.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // React Native has no URL bar; we parse the deep link ourselves
      },
    })
  : null;

/** Use where a configured client is required; throws a clear error otherwise. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env',
    );
  }
  return supabase;
}
