// On-device taste profile + allergy list. Persisted so it survives reloads.
// Cuisines/diets are a soft recipe bias; allergies feed the hard server guard.
// (When Google auth lands, this syncs to the `profiles` table — ADR-0005.)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PrefsState {
  cuisines: string[];
  diets: string[];
  allergies: string[];
  setPrefs: (next: Partial<Pick<PrefsState, 'cuisines' | 'diets' | 'allergies'>>) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      cuisines: [],
      diets: [],
      allergies: [],
      setPrefs: (next) => set(next),
    }),
    { name: 'srp.prefs.v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
