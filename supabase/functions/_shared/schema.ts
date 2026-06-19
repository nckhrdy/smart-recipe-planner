// Shared types + response-format JSON schemas (ADR-0003).
// These run in Deno (Edge Functions) and are exercised by the Node/jest tests —
// keep this file pure: no Deno or Node APIs, no imports.
//
// Structured-output limits (verified against the Claude API): JSON schema cannot
// express minItems/maxItems or numeric ranges, so "exactly 5" and any bounds are
// enforced in rules.ts, not here. Every object sets additionalProperties:false;
// optional fields are modelled as nullable + required (most robust for strict
// structured output) rather than omitted.

// ── Call 1: vision / ingredient catalog ──────────────────────────────────────
export interface Ingredient {
  name: string; // canonical food noun: "tomato", "eggs", "cheddar"
  count: number | null; // discrete count (6 eggs); null for loose/bulk (spinach, oil)
}

export interface IngredientCatalog {
  ingredients: Ingredient[];
}

// ── Call 2: recipe generation ────────────────────────────────────────────────
export interface RecipeIngredient {
  name: string; // "cherry tomatoes"
  amount: number | null; // scalable quantity; null = non-scalable ("to taste")
  unit: string | null; // "cups", "g", "tbsp", "cloves"; null for countable
  note: string | null; // prep or qualitative amount: "halved", "to taste"
}

/** What the model returns. Server-computed fields (id, totalMinutes, signature) are added in code. */
export interface Recipe {
  title: string;
  hook: string; // one line
  dishType: string; // "frittata", "stir-fry", "soup" — drives no-repeat variety (ADR-0004)
  prepMinutes: number;
  cookMinutes: number;
  servings: number; // BASE servings the amounts are written for
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[]; // "Vegetarian", "Breakfast" — drive filters + card tag
}

/** A Recipe after the rule layer adds server-computed fields (ADR-0003 §Server-computed). */
export interface ProcessedRecipe extends Recipe {
  totalMinutes: number;
  signature: string;
}

export interface RecipesResponse {
  recipes: Recipe[];
}

// ── JSON schemas passed via output_config.format ─────────────────────────────
export const INGREDIENT_CATALOG_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          count: { type: ['integer', 'null'] },
        },
        required: ['name', 'count'],
      },
    },
  },
  required: ['ingredients'],
} as const;

export const RECIPES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          hook: { type: 'string' },
          dishType: { type: 'string' },
          prepMinutes: { type: 'integer' },
          cookMinutes: { type: 'integer' },
          servings: { type: 'integer' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                amount: { type: ['number', 'null'] },
                unit: { type: ['string', 'null'] },
                note: { type: ['string', 'null'] },
              },
              required: ['name', 'amount', 'unit', 'note'],
            },
          },
          steps: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'title',
          'hook',
          'dishType',
          'prepMinutes',
          'cookMinutes',
          'servings',
          'ingredients',
          'steps',
          'tags',
        ],
      },
    },
  },
  required: ['recipes'],
} as const;
