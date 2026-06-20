// Deterministic vegetarian classifier. The model's free-form `tags` are an
// unreliable signal — a plainly meat-free pasta often carries no "vegetarian"
// tag — so we infer from the data that's actually trustworthy: the ingredients
// (and the title as a safety net). A recipe is vegetarian when none of its
// ingredient names mention meat, poultry, or seafood. Vegan recipes pass too.

import type { Recipe } from '@/lib/types';

// Singular, lowercase. Matched per-word (not substring) so "scalloped potatoes",
// "chickpea", and "graham cracker" are NOT mistaken for scallop/chicken/ham.
const MEAT_TERMS = new Set<string>([
  // red meat & pork
  'beef', 'steak', 'veal', 'lamb', 'mutton', 'venison', 'pork', 'bacon', 'ham',
  'prosciutto', 'pancetta', 'sausage', 'salami', 'pepperoni', 'chorizo',
  'meatball', 'meatloaf', 'hamburger', 'gelatin', 'lard', 'pastrami',
  // poultry & game
  'chicken', 'turkey', 'duck', 'quail', 'poultry',
  // fish & seafood
  'fish', 'salmon', 'tuna', 'cod', 'haddock', 'halibut', 'tilapia', 'trout',
  'mackerel', 'sardine', 'anchovy', 'anchovies', 'snapper', 'bass',
  'shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'scallop', 'clam',
  'mussel', 'oyster', 'squid', 'calamari', 'octopus',
]);

/** Drop a single trailing plural "s" ("prawns" → "prawn", "sausages" → "sausage")
 *  while leaving "ss" words and short words alone. Irregulars (anchovies) are in
 *  the set directly. */
function depluralize(word: string): string {
  return word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

function mentionsMeat(text: string): boolean {
  return text
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .some((word) => MEAT_TERMS.has(word) || MEAT_TERMS.has(depluralize(word)));
}

/** True when no meat, poultry, or seafood appears in the recipe's ingredients or title. */
export function isVegetarian(recipe: Pick<Recipe, 'title' | 'ingredients'>): boolean {
  if (mentionsMeat(recipe.title)) return false;
  return !recipe.ingredients.some((ing) => mentionsMeat(ing.name));
}
