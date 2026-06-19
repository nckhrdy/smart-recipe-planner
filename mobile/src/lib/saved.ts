// Saved recipes ("My Recipes"). Persisted on-device so keepers survive Refresh
// and reloads. Under the dev bypass there's no signed-in user, so this is the
// working store; once Google auth lands it syncs to the RLS-guarded
// `saved_recipes` table (ADR-0005).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Recipe } from '@/lib/types';

interface SavedState {
  recipes: Recipe[];
  toggle: (recipe: Recipe) => void;
  remove: (id: string) => void;
}

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      recipes: [],
      toggle: (recipe) => {
        const exists = get().recipes.some((r) => r.id === recipe.id);
        set({
          recipes: exists
            ? get().recipes.filter((r) => r.id !== recipe.id)
            : [recipe, ...get().recipes],
        });
      },
      remove: (id) => set({ recipes: get().recipes.filter((r) => r.id !== id) }),
    }),
    { name: 'srp.saved.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
