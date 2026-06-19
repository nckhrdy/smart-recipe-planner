# Code Review: fix/recipe-ux-and-ingredient-enforcement

**Date:** 2026-06-19
**Stack:** Expo / React Native (TypeScript) + Supabase Edge Functions (Deno), Jest for the rule layer
**Files changed:** 10 (scope: this branch's single commit on top of `docs/readme`)
**Verdict:** PASS

> Scope note: `main` is stale (brief/prototypes/ADRs only — the app was never merged there), so `merge-base HEAD main` captures the entire 25k-line app. This review targets the actual branch delta (`docs/readme..HEAD`): the timer, ingredient-enforcement, capture-label, and brand-loader work.

## Summary
Three bug fixes (on-hand ingredient enforcement, timer digit clipping, web capture label) plus UI polish (shared `BrandLoader`, add-picker "add several in a row" flow, `Wordmark` component). The headline change — a deterministic ingredient-containment gate in `rules.ts` — is the right design (closes the open half of ADR-0002 "the model proposes; our code disposes"), is well-tested (5 new cases, 19/19 green), and keeps the prompt allowlist in sync with the code. Typecheck and ESLint are clean across all changed files. No blocking issues.

## Findings

| Severity | File:Line | Issue | Suggestion |
|----------|-----------|-------|------------|
| NOTE | supabase/functions/_shared/rules.ts:~155 | Containment uses ANY-token matching, so a compound off-list item that contains an on-hand word slips through (e.g. `egg noodles` passes via `egg`, `onion soup mix` via `onion`). | Acceptable v1 tradeoff (the alternative — all-tokens-must-match — over-rejects legit descriptors like "cherry tomatoes"). Documented in-code. Revisit with a small descriptor/stopword set if false-accepts show up. |
| NOTE | supabase/functions/recipes/index.ts:16 | Tighter gate + `OVER_GENERATE=6` / `MAX_ROUNDS=2` will raise `exhausted:true` frequency for sparse pantries (e.g. 4 ingredients). | This is the intended honest behaviour (ADR-0004), but worth watching — if users hit "explored these" too fast, bump over-generate or widen `PANTRY_STAPLES`. |
| NOTE | mobile/src/components/ui/brand-loader.tsx:90 | `messages[index]` can read `undefined` for one frame if a shorter array is passed after `index` advanced. | Not reachable today (messages are module constants), but `messages[index] ?? messages[0]` would make it bulletproof. |
| NOTE | mobile/src/app/(app)/confirm.tsx:213,269 | `pickFromList` sets `lastAdded` but the "Added …" confirmation can never surface for the curated path: it only renders when `q === ''`, and the only way to clear the query (`onType`) nulls `lastAdded`. Dead-ish state. | Harmless. If the confirmation is wanted for list picks too, show it regardless of query, or don't set `lastAdded` in `pickFromList`. |

## Systemic Issues
- **`Alert.alert` multi-button menus don't work on react-native-web** — `confirm.tsx:49` (`addPhoto`) presents a Take-photo / Choose-from-library menu that react-native-web renders as a single-button alert, so **web users can't add photos from the Confirm screen.** Out of this diff's scope (pre-existing), but it's the same web/native mismatch this branch fixed on the Camera screen. Recommend a follow-up: on web, skip the menu and call `addFrom('library')` directly.
- **`main` is not the integration branch.** The entire app lives on `docs/readme`; `main` has only the brief/ADRs/prototypes. Branch-from-main conventions and any "diff vs main" tooling are misleading until `docs/readme` lands on `main`. Worth resolving before more branches stack up.

## Positives
- Ingredient gate is pure, I/O-free, and symmetric: `singularize` runs on both the available list and recipe tokens, so even imperfect stems match consistently.
- Prompt allowlist and `PANTRY_STAPLES` are explicitly called out as "two halves of one contract" and kept in sync.
- New test coverage maps directly to the reported bug (the guacamole-soup `vegetable broth` / `lime juice` case).
- Web capture label fix is correctly platform-gated and leaves native wording intact.

---

## Follow-up review — containment leniency fix + diet guard (2026-06-19)

**Verdict:** PASS. **Tests:** 31/31 green.

Reviews the later uncommitted delta on this branch: (1) the `DERIVED_PRODUCT_TERMS` fix to `offListIngredients`, and (2) the diet guard (`findDietConflict` / `filterByDiet` / `isDietExcludedIngredient`) + its wiring.

### Context
This closes the **NOTE on line 17 above** — the any-token leniency. Reported symptom: setting an *egg* allergy makes recipes "use ingredients I don't have." Mechanism confirmed by repro: the allergy removes eggs (a keystone ingredient) from the buildable set, the model pads the gap, and the any-token gate let compound padding (`tomato sauce`, `onion powder`, `spinach pesto`) through on a single shared word. The fix flags a derived/processed product even when a flavour word matches — unless the product itself is on hand.

### Findings

| Severity | File:Line | Issue | Suggestion |
|----------|-----------|-------|------------|
| NOTE | `rules.ts` `DERIVED_PRODUCT_TERMS` | `juice` flags `lemon juice` / `lime juice` as off-list **even when the source fruit is on hand** — you can juice a lemon you have. Mild over-rejection. | Intentional or not? If juicing-on-hand should be allowed, drop `juice` from the set or special-case `<on-hand-fruit> juice`. Pin the decision with a test either way. |
| NOTE | `rules.ts` `DERIVED_PRODUCT_TERMS` | Single-word entries (`salsa`, `hummus`, `tahini`, `pesto`) are redundant with branch (a) — a standalone off-list item is already caught by "no token on hand." | Harmless. They only earn their place as the second word of a compound (`red pepper hummus`); fine to keep for clarity. |
| NOTE | `rules.ts` `isAllergenIngredient` (pre-existing) | Prefix match `\begg` also matches **eggplant**, so an egg allergy drops eggplant from input and flags eggplant recipes. Narrow false-positive. | Documented as a known edge case in the README. Prefix is deliberate (catches plurals), so a fix means a small exception list, not a regex change. |
| NOTE | `rules.ts` `dietExcludedTerms` | Same prefix-free word match is solid here (per-word + depluralize), but `gelatin`/`lard` for vegan are in `MEAT_TERMS` (vegetarian), not also enforced for honey-style vegan-only — fine today since vegetarian ⊆ vegan enforcement. | No action; noting the term-set layering is correct. |

### Positives
- Fix is surgical: `crispy onions` (descriptor) and `chicken breast` (cut of an on-hand item) still pass; only processed products are newly caught. Verified by the retained "descriptors or plurals" test.
- The on-hand-product case is tested (`soy sauce` passes when on hand), so the denylist can't over-reject things the user actually has.
- Diet guard mirrors the allergy guard's "drop from input, then hard-filter output" shape (`recipes/index.ts:105`), so vegetarian/vegan don't collapse generation the way a naive post-filter would.
- Honest-exhaustion trade-off (tighter gate → `exhausted:true` sooner on sparse pantries) is the intended ADR-0004 behaviour and is now documented in the README's edge-cases section.
