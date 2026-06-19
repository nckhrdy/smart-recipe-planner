// Deterministic rule layer (ADR-0002 "the model proposes; our code disposes",
// ADR-0004 no-repeat). Pure functions, no I/O — this is the high-value test
// target. The Claude calls + backfill loop that USE these live in the handlers.

import type { ProcessedRecipe, Recipe } from './schema.ts';

export const TARGET_COUNT = 5;

// ── No-repeat signature (ADR-0004) ───────────────────────────────────────────
// Fingerprint the CONCEPT (normalized title), never the ingredients — every
// recipe in a session shares the same ingredient set, so an ingredient-based
// signature would false-positive and block legitimate variety.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'with', 'and', 'in', 'on', 'for', 'to', 'your', 'our', 'style',
]);

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w))
    .sort()
    .join(' ');
}

/** The exclusion key. We use the normalized title directly — a hash would only
 *  compact it, and set membership works the same either way. */
export function signature(title: string): string {
  return normalizeTitle(title);
}

// ── Distinctness: drop excluded + in-batch duplicates ────────────────────────
export function selectDistinct(recipes: Recipe[], excludeTitles: string[]): ProcessedRecipe[] {
  const excluded = new Set(excludeTitles.map(signature));
  const seen = new Set<string>();
  const kept: ProcessedRecipe[] = [];

  for (const recipe of recipes) {
    const sig = signature(recipe.title);
    if (excluded.has(sig) || seen.has(sig)) continue;
    seen.add(sig);
    kept.push({ ...recipe, signature: sig, totalMinutes: recipe.prepMinutes + recipe.cookMinutes });
  }
  return kept;
}

// ── Allergy guard (hard check; ADR product brief) ────────────────────────────
// v1 is honest literal + common-synonym matching. A learned/embedding allergen
// map is the documented v2 lever (e.g. "dairy" won't catch an exotic cheese name).
const ALLERGEN_SYNONYMS: Record<string, string[]> = {
  dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'ghee', 'custard', 'parmesan', 'cheddar', 'mozzarella'],
  egg: ['egg', 'mayonnaise', 'mayo', 'meringue', 'aioli'],
  peanut: ['peanut', 'groundnut'],
  'tree nut': ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'pine nut'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'scallop', 'clam', 'mussel', 'oyster'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'haddock', 'tilapia', 'trout'],
  gluten: ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye', 'couscous', 'breadcrumb', 'cracker', 'noodle'],
  wheat: ['wheat', 'flour', 'bread', 'pasta', 'couscous', 'breadcrumb', 'noodle'],
  soy: ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso'],
  sesame: ['sesame', 'tahini'],
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Terms to search for a given allergy: the term itself plus any synonym group it maps to. */
function termsForAllergy(allergy: string): string[] {
  const key = allergy.toLowerCase().trim();
  const terms = new Set<string>([key]);
  for (const [group, synonyms] of Object.entries(ALLERGEN_SYNONYMS)) {
    if (key === group || key.includes(group) || group.includes(key)) {
      synonyms.forEach((s) => terms.add(s));
    }
  }
  return [...terms];
}

/** Returns the offending allergy if the recipe contains it, else null. */
export function findAllergen(recipe: Recipe, allergies: string[]): string | null {
  const haystack = [recipe.title, ...recipe.tags, ...recipe.ingredients.map((i) => i.name)]
    .join(' ')
    .toLowerCase();

  for (const allergy of allergies) {
    for (const term of termsForAllergy(allergy)) {
      // Prefix-word match: "\bpeanut" hits "peanut butter" and "peanuts".
      if (new RegExp(`\\b${escapeRegExp(term)}`, 'i').test(haystack)) return allergy;
    }
  }
  return null;
}

export function filterAllergenFree<T extends Recipe>(recipes: T[], allergies: string[]): T[] {
  if (allergies.length === 0) return recipes;
  return recipes.filter((r) => findAllergen(r, allergies) === null);
}

/** True if an ingredient name itself is (or maps to) an allergen. Used to drop it
 *  from the generation INPUT, so the model never builds a recipe around it —
 *  otherwise the guard would reject every recipe and return nothing. */
export function isAllergenIngredient(name: string, allergies: string[]): boolean {
  if (allergies.length === 0) return false;
  for (const allergy of allergies) {
    for (const term of termsForAllergy(allergy)) {
      if (new RegExp(`\\b${escapeRegExp(term)}`, 'i').test(name.toLowerCase())) return true;
    }
  }
  return false;
}

// ── Combined deterministic pass ──────────────────────────────────────────────
export interface ProcessOptions {
  excludeTitles?: string[];
  allergies?: string[];
}

/** Distinct (no exclude/in-batch repeats) AND allergen-free, with server fields added.
 *  Does NOT cap to 5 — the handler decides whether to backfill or trim. */
export function process(recipes: Recipe[], opts: ProcessOptions = {}): ProcessedRecipe[] {
  const distinct = selectDistinct(recipes, opts.excludeTitles ?? []);
  return filterAllergenFree(distinct, opts.allergies ?? []);
}
