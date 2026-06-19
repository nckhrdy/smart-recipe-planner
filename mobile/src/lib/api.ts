// The app's view of the backend (ADR-0005). Calls the Edge Functions via
// supabase.functions.invoke — the URL is derived from the configured Supabase
// URL and the auth header (user JWT, or anon key in dev) is attached
// automatically, so nothing about the backend location is hardcoded here.

import { requireSupabase } from '@/lib/supabase';
import type { CapturedImage, Ingredient, RecipesResult, VisionResult } from '@/lib/types';

export interface RecipeRequest {
  ingredients: Ingredient[];
  servings: number;
  exclude: { titles: string[]; dishTypes: string[] };
  prefs?: { cuisines?: string[]; diets?: string[] };
  allergies?: string[];
}

/** Pull the typed `{ error }` message a function returned, falling back gracefully. */
async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (ctx?.json) {
      try {
        const body = (await ctx.json()) as { error?: string };
        if (body?.error) return body.error;
      } catch {
        /* fall through to the generic message */
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export async function detectIngredients(images: CapturedImage[]): Promise<VisionResult> {
  const supabase = requireSupabase();
  const payload = images.map(({ data, mediaType }) => ({ data, mediaType })); // drop local uri
  const { data, error } = await supabase.functions.invoke<VisionResult>('vision', { body: { images: payload } });
  if (error) throw new Error(await functionErrorMessage(error, 'Could not read the photo'));
  if (!data) throw new Error('No ingredients came back from the photo');
  return data;
}

export async function generateRecipes(request: RecipeRequest): Promise<RecipesResult> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke<RecipesResult>('recipes', { body: request });
  if (error) throw new Error(await functionErrorMessage(error, 'Could not generate recipes'));
  if (!data) throw new Error('No recipes came back');
  return data;
}
