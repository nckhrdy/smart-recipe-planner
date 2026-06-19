// POST /recipes — Call 2 of the pipeline (ADR-0002): confirmed ingredients →
// exactly-5 distinct, allergy-safe recipes. The model proposes; the rule layer
// (rules.ts) disposes. Refresh re-hits this endpoint with a growing exclude list
// (ADR-0004); vision is never re-paid.
//
// No-repeat: the client sends the full list of already-shown TITLES; the server
// signatures them for the hard filter and uses the recent slice as a prompt hint
// (refines ADR-0004 — titles instead of client-computed signatures, so the
// signature logic lives in exactly one place: the server).

import { callClaudeStructured, ClaudeError, MODELS } from '../_shared/claude.ts';
import { type ProcessedRecipe, RECIPES_SCHEMA, type RecipesResponse } from '../_shared/schema.ts';
import { isAllergenIngredient, isDietExcludedIngredient, process as applyRules, TARGET_COUNT } from '../_shared/rules.ts';
import { CORS_HEADERS, errorResponse, json } from '../_shared/cors.ts';

const OVER_GENERATE = 6; // over-generate, then filter to 5 (ADR-0004)
const MAX_ROUNDS = 2; // bounded backfill so a refresh never hangs
const RECENT_TITLES_HINT = 15;

const SYSTEM = `You generate distinct, realistic home recipes from a confirmed list of on-hand ingredients.
Hard rules:
- Use ONLY the provided ingredients plus these assumed pantry staples: salt, pepper, oil, water. Do NOT introduce ANY other ingredient — no broth/stock, no citrus or juice, no dairy, no sauces, no extra spices or produce that isn't in the list. If a dish can't be built within this set, don't return it.
- Every recipe must be a GENUINELY DIFFERENT dish style — vary dishType (stir-fry, soup, frittata, salad, bake, curry, ...).
- NEVER include any listed allergen, in any form or derivative.
- Cuisine preferences are a soft bias. Dietary restrictions (e.g. vegetarian, vegan) are HARD: never include an excluded ingredient or a dish built around one.
Format: integer minutes; numbered logical steps; amount is null for "to taste" items; write amounts for the given base servings.`;

interface RecipeRequest {
  ingredients: { name: string; count: number | null }[];
  servings: number;
  exclude: { titles: string[]; dishTypes: string[] };
  prefs: { cuisines?: string[]; diets?: string[] };
  allergies: string[];
}

function buildPrompt(input: RecipeRequest, excludeTitles: string[], excludeDishTypes: string[], want: number): string {
  const lines: string[] = [];
  lines.push(
    `Ingredients on hand: ${input.ingredients.map((i) => (i.count ? `${i.name} x${i.count}` : i.name)).join(', ')}.`,
  );
  lines.push(`Cooking for ${input.servings} ${input.servings === 1 ? 'person' : 'people'}.`);
  if (input.prefs.cuisines?.length) lines.push(`Preferred cuisines (soft): ${input.prefs.cuisines.join(', ')}.`);
  if (input.prefs.diets?.length) {
    const strict = input.prefs.diets.filter((d) => /vegetarian|vegan/i.test(d));
    const soft = input.prefs.diets.filter((d) => !/vegetarian|vegan/i.test(d));
    if (strict.length) {
      const vegan = strict.some((d) => /vegan/i.test(d));
      lines.push(
        `STRICT diet — every recipe must be ${strict.join(' and ').toLowerCase()}: no meat, poultry, or seafood${vegan ? ', and no dairy, eggs, or honey' : ''}.`,
      );
    }
    if (soft.length) lines.push(`Other dietary preferences (soft): ${soft.join(', ')}.`);
  }
  if (input.allergies.length) {
    lines.push(`STRICT — exclude these allergens and anything derived from them: ${input.allergies.join(', ')}.`);
  }
  const recent = excludeTitles.slice(-RECENT_TITLES_HINT);
  if (recent.length) lines.push(`Already shown — return NEW, different dishes, not these: ${recent.join('; ')}.`);
  const dishTypes = [...new Set(excludeDishTypes)];
  if (dishTypes.length) lines.push(`Dish styles already used — prefer different ones: ${dishTypes.join(', ')}.`);
  lines.push(`Generate ${want} distinct recipes.`);
  return lines.join('\n');
}

function parseRequest(body: Record<string, unknown>): RecipeRequest | string {
  const ingredients = body?.ingredients;
  if (!Array.isArray(ingredients) || ingredients.length === 0) return '`ingredients` must be a non-empty array';
  if (ingredients.some((i) => typeof i?.name !== 'string' || i.name.trim().length === 0)) {
    return 'each ingredient needs a non-empty `name`';
  }
  const excludeRaw = (body?.exclude ?? {}) as Record<string, unknown>;
  const prefsRaw = (body?.prefs ?? {}) as Record<string, unknown>;
  const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

  return {
    ingredients: ingredients.map((i) => ({
      name: String(i.name).trim().toLowerCase(),
      count: typeof i.count === 'number' && i.count > 0 ? Math.round(i.count) : null,
    })),
    servings: Number.isInteger(body?.servings) && (body.servings as number) > 0 ? (body.servings as number) : 2,
    exclude: { titles: strList(excludeRaw.titles), dishTypes: strList(excludeRaw.dishTypes) },
    prefs: { cuisines: strList(prefsRaw.cuisines), diets: strList(prefsRaw.diets) },
    allergies: strList(body?.allergies),
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const parsed = parseRequest(body);
  if (typeof parsed === 'string') return errorResponse(parsed);

  // Never offer the model an ingredient the user is allergic to — otherwise it
  // builds recipes around it and the guard rejects all of them. Same reasoning for
  // a hard diet: a vegetarian's chicken (or a vegan's milk) is dropped from input.
  const diets = parsed.prefs.diets ?? [];
  parsed.ingredients = parsed.ingredients.filter(
    (i) => !isAllergenIngredient(i.name, parsed.allergies) && !isDietExcludedIngredient(i.name, diets),
  );
  if (parsed.ingredients.length === 0) return json({ recipes: [], exhausted: true });

  const kept: (ProcessedRecipe & { id: string })[] = [];
  const keptTitles: string[] = [];
  const availableNames = parsed.ingredients.map((i) => i.name);

  try {
    for (let round = 0; round < MAX_ROUNDS && kept.length < TARGET_COUNT; round++) {
      const excludeTitles = [...parsed.exclude.titles, ...keptTitles];
      const excludeDishTypes = [...parsed.exclude.dishTypes, ...kept.map((r) => r.dishType)];
      const want = round === 0 ? OVER_GENERATE : Math.min(OVER_GENERATE, TARGET_COUNT - kept.length + 2);

      const result = await callClaudeStructured<RecipesResponse>({
        model: MODELS.generate, // Haiku 4.5 — fast Refresh
        system: SYSTEM,
        content: [{ type: 'text', text: buildPrompt(parsed, excludeTitles, excludeDishTypes, want) }],
        schema: RECIPES_SCHEMA,
        maxTokens: 6000,
      });

      // Deterministic guarantees: distinct (vs exclude + this session's keepers),
      // allergy-safe, diet-compliant (vegetarian/vegan), AND buildable from on-hand
      // ingredients + staples (the model ignores these often enough that the gate
      // is load-bearing, not belt-and-suspenders).
      const processed = applyRules(result.recipes ?? [], {
        excludeTitles,
        allergies: parsed.allergies,
        diets,
        available: availableNames,
      });
      for (const recipe of processed) {
        if (kept.length >= TARGET_COUNT) break;
        kept.push({ ...recipe, id: crypto.randomUUID() });
        keptTitles.push(recipe.title);
      }
    }

    const recipes = kept.slice(0, TARGET_COUNT);
    // Honest exhaustion (ADR-0004): fewer than 5 means the ingredient set is tapped out.
    return json({ recipes, exhausted: recipes.length < TARGET_COUNT });
  } catch (err) {
    const status = err instanceof ClaudeError ? err.status : 502;
    return errorResponse(err instanceof Error ? err.message : 'Recipe generation failed', status);
  }
});
