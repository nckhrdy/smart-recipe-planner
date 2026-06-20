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

// ── Diet guard (vegetarian / vegan; hard when set) ───────────────────────────
// Same deterministic spirit as the allergy guard, driven by the user's diet
// preference. We enforce only the diets judgeable from ingredient names:
// Vegetarian (no meat/poultry/seafood) and Vegan (also no dairy/egg/honey).
// Pescatarian/Keto/Gluten-free stay a prompt-level soft bias (they need fish-
// allowed nuance or nutrition we don't compute). Terms match per WORD with plural
// folding, so "scalloped potatoes" and "chickpea" aren't read as scallop/chicken.
const MEAT_TERMS = [
  'beef', 'steak', 'veal', 'lamb', 'mutton', 'venison', 'pork', 'bacon', 'ham', 'prosciutto',
  'pancetta', 'sausage', 'salami', 'pepperoni', 'chorizo', 'meatball', 'meatloaf', 'hamburger',
  'pastrami', 'lard', 'gelatin', 'chicken', 'turkey', 'duck', 'quail', 'poultry',
];
const SEAFOOD_TERMS = [
  'fish', 'salmon', 'tuna', 'cod', 'haddock', 'halibut', 'tilapia', 'trout', 'mackerel', 'sardine',
  'anchovy', 'anchovies', 'snapper', 'bass', 'shrimp', 'prawn', 'crab', 'lobster', 'crayfish',
  'scallop', 'clam', 'mussel', 'oyster', 'squid', 'calamari', 'octopus',
];
// Excluded for VEGAN beyond meat + seafood.
const ANIMAL_PRODUCT_TERMS = [
  'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'buttermilk', 'ghee', 'custard',
  'parmesan', 'cheddar', 'mozzarella', 'mascarpone', 'ricotta', 'feta',
  'egg', 'mayonnaise', 'mayo', 'honey',
];
// Animal terms with common plant analogs — only a conflict when NOT preceded by a
// plant qualifier, so "almond milk", "peanut butter", "coconut cream", "flax egg",
// and "vegan cheese" stay vegan-safe.
const ANALOG_TERMS = new Set(['milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt', 'egg', 'mayo', 'mayonnaise']);
const PLANT_QUALIFIERS = new Set([
  'almond', 'soy', 'soya', 'oat', 'coconut', 'cashew', 'peanut', 'rice', 'hemp', 'pea', 'flax', 'chia',
  'sunflower', 'sesame', 'macadamia', 'hazelnut', 'walnut', 'pecan', 'pistachio', 'nut', 'cocoa',
  'vegan', 'plant', 'nondairy', 'olive', 'avocado',
]);

/** Strip a single trailing plural "s" ("prawns" → "prawn"), leaving "ss" and short words. */
function depluralize(word: string): string {
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

/** The ingredient words a given diet forbids. Empty = nothing to enforce. */
function dietExcludedTerms(diets: string[]): Set<string> {
  const lower = diets.map((d) => d.toLowerCase());
  const vegetarian = lower.some((d) => d.includes('vegetarian') || d.includes('vegan'));
  const vegan = lower.some((d) => d.includes('vegan'));
  const terms = new Set<string>();
  if (vegetarian) {
    for (const t of MEAT_TERMS) terms.add(t);
    for (const t of SEAFOOD_TERMS) terms.add(t);
  }
  if (vegan) for (const t of ANIMAL_PRODUCT_TERMS) terms.add(t);
  return terms;
}

function mentionsExcluded(text: string, terms: Set<string>): boolean {
  const words = text.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w.length > 0);
  return words.some((word, i) => {
    const base = terms.has(word) ? word : terms.has(depluralize(word)) ? depluralize(word) : null;
    if (!base) return false;
    if (ANALOG_TERMS.has(base)) {
      const prev = i > 0 ? words[i - 1] : '';
      if (PLANT_QUALIFIERS.has(prev) || PLANT_QUALIFIERS.has(depluralize(prev))) return false; // "almond milk" etc.
    }
    return true;
  });
}

/** Returns the offending diet label if the recipe violates it, else null. */
export function findDietConflict(recipe: Recipe, diets: string[]): string | null {
  const terms = dietExcludedTerms(diets);
  if (terms.size === 0) return null;
  const names = [recipe.title, ...recipe.ingredients.map((i) => i.name)];
  if (names.some((n) => mentionsExcluded(n, terms))) {
    return diets.find((d) => /vegan/i.test(d)) ?? diets.find((d) => /vegetarian/i.test(d)) ?? 'diet';
  }
  return null;
}

export function filterByDiet<T extends Recipe>(recipes: T[], diets: string[]): T[] {
  if (dietExcludedTerms(diets).size === 0) return recipes;
  return recipes.filter((r) => findDietConflict(r, diets) === null);
}

/** True if an ingredient name is forbidden by the active diet — used to drop it
 *  from the generation INPUT (so the model never builds around it), mirroring the
 *  allergen handling so the guard doesn't end up rejecting every recipe. */
export function isDietExcludedIngredient(name: string, diets: string[]): boolean {
  const terms = dietExcludedTerms(diets);
  if (terms.size === 0) return false;
  return mentionsExcluded(name, terms);
}

// ── On-hand containment (the product premise: "cook with what you've got") ───
// ADR-0002: the model PROPOSES ingredients; here our code DISPOSES of any the
// user neither has on hand nor can be assumed to keep. Without this gate the
// model quietly pads recipes with off-list items (broth, citrus, sauces) and the
// "spotted N ingredients" promise is broken.
//
// PANTRY_STAPLES must mirror exactly what the generation prompt permits — they
// are two halves of one contract, so keep them in sync.
export const PANTRY_STAPLES = ['salt', 'pepper', 'oil', 'water'] as const;

/** Crude singular form so "tomatoes" matches "tomato" and "eggs" matches "egg". */
function singularize(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 2 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Lowercase food name → singularized word tokens ("Cherry Tomatoes" → [cherry, tomato]). */
function foodTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map(singularize);
}

function allowedTokens(available: string[]): Set<string> {
  const set = new Set<string>();
  for (const name of [...available, ...PANTRY_STAPLES]) {
    for (const token of foodTokens(name)) set.add(token);
  }
  return set;
}

// A processed/derived product is a DIFFERENT item from the raw ingredient it's
// named after: "tomato sauce", "onion powder", "spinach pesto", "vegetable broth"
// are not the "tomato / onion / spinach" you have on hand. Without this set, the
// any-token match below counts them as on-hand because they share ONE word with a
// real ingredient — which is exactly how recipes end up calling for things the user
// doesn't have. It surfaces most when an allergy removes a keystone ingredient and
// the model pads the gap (see the egg-allergy report). v1 is this curated word set;
// a learned ingredient map is the documented v2 lever.
const DERIVED_PRODUCT_TERMS = new Set([
  'sauce', 'paste', 'powder', 'puree', 'broth', 'stock', 'juice', 'pesto', 'jam',
  'jelly', 'syrup', 'extract', 'vinegar', 'wine', 'marinade', 'dressing', 'mayonnaise',
  'mayo', 'ketchup', 'mustard', 'relish', 'chutney', 'concentrate', 'bouillon', 'gravy',
  'salsa', 'hummus', 'tahini',
]);

/** Recipe ingredient names that are neither on-hand nor a pantry staple. Empty = clean.
 *  An ingredient line counts as on-hand if it MENTIONS an available item or staple —
 *  so "crispy onion" matches "onion" and "olive oil" matches the oil staple — UNLESS
 *  it names a processed product (sauce/paste/broth/…) the user doesn't actually have,
 *  so "tomato sauce" is flagged even though "tomato" is on hand. */
export function offListIngredients(recipe: Recipe, available: string[]): string[] {
  const allowed = allowedTokens(available);
  return recipe.ingredients
    .filter((ing) => {
      const tokens = foodTokens(ing.name);
      if (tokens.length === 0) return false;
      // (a) nothing in the line is on hand, OR (b) the line names a processed product
      // the user doesn't have — even if a flavour word in it matches something on hand.
      const noTokenOnHand = !tokens.some((t) => allowed.has(t));
      const derivedAndMissing = tokens.some((t) => DERIVED_PRODUCT_TERMS.has(t) && !allowed.has(t));
      return noTokenOnHand || derivedAndMissing;
    })
    .map((ing) => ing.name);
}

export function usesOnlyAvailable(recipe: Recipe, available: string[]): boolean {
  return offListIngredients(recipe, available).length === 0;
}

export function filterByAvailable<T extends Recipe>(recipes: T[], available: string[]): T[] {
  if (available.length === 0) return recipes; // no pantry context → nothing to enforce against
  return recipes.filter((r) => usesOnlyAvailable(r, available));
}

// ── Combined deterministic pass ──────────────────────────────────────────────
export interface ProcessOptions {
  excludeTitles?: string[];
  allergies?: string[];
  diets?: string[]; // vegetarian/vegan enforced hard; others ignored here
  available?: string[]; // confirmed on-hand ingredient names; recipes may use only these + staples
}

/** Distinct (no exclude/in-batch repeats), allergen-free, diet-compliant, AND
 *  buildable from the on-hand ingredients (+ staples), with server fields added.
 *  Does NOT cap to 5 — the handler decides whether to backfill or trim. */
export function process(recipes: Recipe[], opts: ProcessOptions = {}): ProcessedRecipe[] {
  const distinct = selectDistinct(recipes, opts.excludeTitles ?? []);
  const safe = filterAllergenFree(distinct, opts.allergies ?? []);
  const dietOk = filterByDiet(safe, opts.diets ?? []);
  return filterByAvailable(dietOk, opts.available ?? []);
}
