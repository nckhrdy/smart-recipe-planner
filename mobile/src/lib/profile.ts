/**
 * Profile sync (ADR-0005). The signed-in user's taste prefs + allergies live in
 * the RLS-guarded `profiles` table (one row per user, columns mirror the prefs
 * store). The quiz writes here on completion and Profile edits write through;
 * sign-in hydrates the local store from here. No-ops when Supabase isn't
 * configured / there's no session — the local store stays the source of truth.
 */
import { supabase } from '@/lib/supabase';
import type { PrefsState } from '@/lib/prefs';

export type ProfilePrefs = Pick<PrefsState, 'cuisines' | 'diets' | 'allergies'>;

/** Read the user's profile row, or null if they don't have one yet. */
export async function fetchProfile(userId: string): Promise<ProfilePrefs | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('cuisines, diets, allergies')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    cuisines: data.cuisines ?? [],
    diets: data.diets ?? [],
    allergies: data.allergies ?? [],
  };
}

/** Upsert the user's prefs (owner-scoped by RLS; the JWT carries auth.uid()). */
export async function saveProfile(userId: string, prefs: ProfilePrefs): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' });
  if (error) throw error;
}
