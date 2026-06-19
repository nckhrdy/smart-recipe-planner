// The photo→recipes session (ADR-0002, ADR-0004). Holds the confirmed
// ingredients, the current 5 recipes, and the accumulating no-repeat memory
// (titles + dish types) sent to the server on each Refresh. Client-authoritative
// exclusion, so the backend stays stateless. Reloading resets the session — a
// documented v1 trade-off.

import { create } from 'zustand';

import { detectIngredients, generateRecipes } from '@/lib/api';
import { usePrefs } from '@/lib/prefs';
import type { CapturedImage, Ingredient, Recipe } from '@/lib/types';

const DEFAULT_SERVINGS = 2;

interface SessionState {
  // capture → confirm
  draftIngredients: Ingredient[];
  servings: number;
  detecting: boolean;
  // results
  recipes: Recipe[];
  shownTitles: string[];
  shownDishTypes: string[];
  exhausted: boolean;
  generating: boolean;
  // shared
  error: string | null;
  hasGenerated: boolean;

  // actions — capture/confirm
  detectFromImages: (images: CapturedImage[]) => Promise<boolean>;
  setServings: (servings: number) => void;
  setCount: (index: number, count: number | null) => void;
  addIngredient: (name: string) => void;
  removeIngredient: (index: number) => void;

  // actions — results
  confirmAndGenerate: () => Promise<boolean>;
  refresh: () => Promise<void>;
  reset: () => void;
  findRecipe: (id: string) => Recipe | undefined;
}

function currentPrefs() {
  const { cuisines, diets, allergies } = usePrefs.getState();
  return { prefs: { cuisines, diets }, allergies };
}

export const useRecipeSession = create<SessionState>((set, get) => ({
  draftIngredients: [],
  servings: DEFAULT_SERVINGS,
  detecting: false,
  recipes: [],
  shownTitles: [],
  shownDishTypes: [],
  exhausted: false,
  generating: false,
  error: null,
  hasGenerated: false,

  detectFromImages: async (images) => {
    set({ detecting: true, error: null });
    try {
      const { ingredients } = await detectIngredients(images);
      // Merge with any existing draft (multi-photo), de-duping by name.
      const merged = [...get().draftIngredients];
      for (const ing of ingredients) {
        if (!merged.some((m) => m.name === ing.name)) merged.push(ing);
      }
      set({ draftIngredients: merged, detecting: false });
      return true;
    } catch (err) {
      set({ detecting: false, error: err instanceof Error ? err.message : 'Could not read the photo' });
      return false;
    }
  },

  setServings: (servings) => set({ servings: Math.max(1, Math.round(servings)) }),

  setCount: (index, count) =>
    set((s) => ({
      draftIngredients: s.draftIngredients.map((ing, i) =>
        i === index ? { ...ing, count: count && count > 0 ? Math.round(count) : null } : ing,
      ),
    })),

  addIngredient: (name) => {
    const clean = name.trim().toLowerCase();
    if (!clean) return;
    set((s) =>
      s.draftIngredients.some((i) => i.name === clean)
        ? s
        : { draftIngredients: [...s.draftIngredients, { name: clean, count: null }] },
    );
  },

  removeIngredient: (index) =>
    set((s) => ({ draftIngredients: s.draftIngredients.filter((_, i) => i !== index) })),

  confirmAndGenerate: async () => {
    const { draftIngredients, servings } = get();
    if (draftIngredients.length === 0) {
      set({ error: 'Add at least one ingredient first' });
      return false;
    }
    set({ generating: true, error: null });
    try {
      const { prefs, allergies } = currentPrefs();
      const { recipes, exhausted } = await generateRecipes({
        ingredients: draftIngredients,
        servings,
        exclude: { titles: [], dishTypes: [] },
        prefs,
        allergies,
      });
      set({
        recipes,
        shownTitles: recipes.map((r) => r.title),
        shownDishTypes: recipes.map((r) => r.dishType),
        exhausted,
        generating: false,
        hasGenerated: true,
      });
      return true;
    } catch (err) {
      set({ generating: false, error: err instanceof Error ? err.message : 'Could not generate recipes' });
      return false;
    }
  },

  refresh: async () => {
    const { draftIngredients, servings, shownTitles, shownDishTypes } = get();
    set({ generating: true, error: null });
    try {
      const { prefs, allergies } = currentPrefs();
      const { recipes, exhausted } = await generateRecipes({
        ingredients: draftIngredients,
        servings,
        exclude: { titles: shownTitles, dishTypes: shownDishTypes },
        prefs,
        allergies,
      });
      set({
        recipes,
        // Keep accumulating so future refreshes avoid everything seen this session.
        shownTitles: [...shownTitles, ...recipes.map((r) => r.title)],
        shownDishTypes: [...shownDishTypes, ...recipes.map((r) => r.dishType)],
        exhausted,
        generating: false,
      });
    } catch (err) {
      set({ generating: false, error: err instanceof Error ? err.message : 'Could not refresh recipes' });
    }
  },

  reset: () =>
    set({
      draftIngredients: [],
      servings: DEFAULT_SERVINGS,
      recipes: [],
      shownTitles: [],
      shownDishTypes: [],
      exhausted: false,
      error: null,
      hasGenerated: false,
    }),

  findRecipe: (id) => get().recipes.find((r) => r.id === id),
}));
