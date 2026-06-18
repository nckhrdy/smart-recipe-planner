# ADR 0003: Ingredient and recipe schemas

## Status

Accepted

## Date

2026-06-18 (amended 2026-06-18 — added `dishType`; see [ADR-0004](./0004-no-repeat-across-refreshes.md))

## Context

[ADR-0002](./0002-llm-pipeline-and-structured-output.md) established two response-format LLM calls. This ADR defines the **field-level schemas** for each — the contracts the UI, the rule layer, and the servings-scaling logic all depend on. Both are JSON schemas passed via `output_config.format`; the model's response is validated against them.

Design principles carried in:
- **Catalog presence, not amounts** (Call 1) — a photo can't estimate "250g of flour"; it can name items and roughly count discrete ones.
- **Structured quantities** (Call 2) — chosen so the detail-screen servings stepper can re-scale live (Option B over plain strings).
- **Shape vs. rules** — schemas guarantee shape; "exactly 5", no-repeat, and allergy-safety are enforced in code (ADR-0002).

## Decision

### Call 1 — Ingredient catalog (vision output)
```ts
type IngredientCatalog = {
  ingredients: {
    name: string        // plain canonical food noun: "tomato", "eggs", "cheddar"
    count?: number      // OPTIONAL int — discrete items only (6 eggs, 2 onions); omit for loose/bulk (spinach, oil)
  }[]
}
```
- The model is prompted to return clean nouns and ignore brand/packaging noise ("Heinz", "organic", "500g bag").
- **No** `confidence` and **no** `category` in v1 — the confirm screen is the correctness mechanism; both are v2 levers (see Alternatives).

### Call 2 — Recipe generation output
The model returns `{ recipes: Recipe[] }`; code coerces to **exactly 5**, distinct, allergy-safe (ADR-0002).
```ts
type Recipe = {
  title: string
  hook: string                       // one line
  dishType: string                   // dish form/concept: "frittata", "stir-fry", "soup" — drives no-repeat variety (ADR-0004)
  prepMinutes: number
  cookMinutes: number
  servings: number                   // BASE servings the amounts are written for
  ingredients: RecipeIngredient[]
  steps: string[]                    // ordered method
  tags: string[]                     // short labels: "Vegetarian", "Breakfast" — drive My Recipes filters + card tag
}

type RecipeIngredient = {
  name: string                       // "cherry tomatoes"
  amount: number | null              // scalable quantity; null = non-scalable ("to taste")
  unit: string | null                // "cups", "g", "tbsp", "cloves"; null for countable items
  note: string | null                // prep OR qualitative quantity: "halved", "diced", "to taste", "for garnish"
}
```

### Server-computed (NOT from the model)
- `id: string` — uuid, assigned per recipe.
- `totalMinutes: number` — `prepMinutes + cookMinutes`.
- `signature: string` — for no-repeat exclusion; derivation defined in the no-repeat ADR.

### Servings scaling (client)
`multiplier = targetServings / recipe.servings`. For each ingredient: if `amount != null`, display `round(amount * multiplier)` (rounded to a sensible fraction, e.g. nearest ¼ for small amounts) with `unit`; append `note` if present. If `amount == null`, render `note` verbatim ("to taste"). Steps and times are **not** scaled.

## Architecture

### Data Flow
- Call 1 → `IngredientCatalog` → rendered as editable chips (name + optional `count`) on the confirm screen.
- Confirmed chips + servings → Call 2 → `Recipe[]` → rule layer (exactly-5 / no-repeat / allergy) → list & detail.
- Detail servings stepper applies the scaling formula above to the in-memory recipe; no model round-trip.

### Response-format notes
- Nullable fields use a union type (`amount: number | null` → `{"type": ["number", "null"]}` in JSON schema). Supported.
- JSON-schema structured output does **not** support `minItems`/`maxItems` or numeric ranges (the SDK strips them) — which is *why* "exactly 5" and any bounds live in code (ADR-0002), not the schema.
- `additionalProperties: false` on every object.

## Consequences

### Positive
- **Live servings scaling** works with no extra model call — multiply and render.
- **Messy quantities handled** — `note` absorbs prep ("diced") and qualitative amounts ("to taste"); `amount: null` keeps them out of the math.
- **Lean vision payload** — `{ name, count? }` is tiny, fast, and easy to confirm/merge across photos.
- **UI-ready** — every field maps directly to a screen element we already designed.

### Negative
- The model must split a natural phrase ("½ onion, finely diced") into `amount/unit/note` — occasionally imperfect; the `note` fallback absorbs ambiguity rather than dropping it.
- Rounding scaled amounts needs a small, tested formatter (¼-fraction rounding) to avoid "0.67 cups".

### Neutral
- `tags` are free-form short strings in v1 (not a fixed enum); the My Recipes filter set can map onto them. Tightening to an enum is a later option.
- `signature` shape is intentionally deferred to the no-repeat ADR.

## Alternatives Considered

### Alternative A: quantity as a display string (`"2 cups, halved"`)
- Pros: simplest; reads like a recipe; no parsing.
- Cons: can't scale client-side — servings would have to be fixed at generation time or trigger a regenerate.
- Why not: we chose live per-recipe scaling on the detail screen; strings can't do the math.

### Alternative B-flat: numeric `amount`/`unit` with no `note`
- Pros: cleanest for scaling.
- Cons: nowhere to put "to taste", "a pinch", or prep descriptors → data loss or awkward coercion.
- Why not: the `note` field is what makes structured quantities survive real recipes.

### Ingredient `confidence` / `category` (Call 1)
- Pros: could pre-flag shaky detections / group chips / drive a waste hint.
- Cons: self-reported confidence is noisy; the confirm step already lets the user fix everything; both add scope.
- Why not (v1): no payoff over the human-in-the-loop confirm. Revisit in v2.

## References

- [ADR-0002](./0002-llm-pipeline-and-structured-output.md) — the two-call pipeline and structured-output approach
- [Screen specs](../../design/screens.md) — Confirm (chips + counts), Recipe Detail (quantities, servings stepper)
- [ADR-0004](./0004-no-repeat-across-refreshes.md) — `signature` derivation, exclusion, backfill, exhaustion
