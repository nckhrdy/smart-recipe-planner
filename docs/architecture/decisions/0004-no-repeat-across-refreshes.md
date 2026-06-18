# ADR 0004: No repeats across refreshes

## Status

Accepted

## Date

2026-06-18

## Context

The prompt requires that refreshing gives 5 recipes that **do not repeat** from refresh to refresh. The [product brief](../../product/2026-06-18-smart-recipe-planner.md) names this the project's **riskiest assumption**: unlike vision (which degrades gracefully — edit a chip), no-repeat fails **cliff-like and on camera**. From a *fixed* ingredient set the space of distinct recipes is finite, so as more recipes are shown the model gets cornered into near-duplicates, off-ingredient dishes, or fewer than 5.

The first instinct — a structured signature over **ingredients + protein** — is wrong here: every recipe in a session is built from the *same* ingredient set, so a frittata, shakshuka, omelette, and strata would all fingerprint identically and we'd block genuinely different dishes. That signature weights the part that is **constant**. The fix is to fingerprint by **concept, not contents**.

## Decision

1. **Signature = normalized title.** Lowercase, strip punctuation, drop stop-words, sort the remaining tokens, hash. This collapses reorderings/casing ("Garlic Tomato Pasta" ≡ "Tomato Garlic Pasta") but keeps distinct dishes distinct ("Spinach Frittata" ≠ "Shakshuka"). **The signature touches neither ingredients nor protein** — those are constant and would false-positive.

2. **Variety is model-driven; the signature is the safety net.** On each refresh the prompt includes the already-shown titles and dish-types and asks for 5 *genuinely different styles*. The model does the variety work (it's good at "5 different kinds of dishes from these ingredients"); the signature only guards against an exact/near-exact repeat slipping through.

3. **Exclusion is client-authoritative.** The client accumulates the session's shown signatures (+ a recent-titles window + dish-types) and sends them with each `/recipes` request. The **backend stays stateless** — it can't desync. Honest caveat: a client reload resets the session's no-repeat memory.

4. **Hard filter server-side.** On the response, the server computes each recipe's signature and drops any that match the exclusion set or duplicate another recipe in the same batch. Survivors are returned; the client adds their signatures to its exclusion list.

5. **Bounded backfill.** Over-generate slightly (request ~6–7), filter; if fewer than 5 survive, make **one** backfill call for the shortfall — hard-capped at **2 rounds total** so a refresh never hangs.

6. **Honest exhaustion state.** If still under 5 after the cap, render what we have plus the nudge — *"You've explored these — add an ingredient or start over"* — never relabeled duplicates. A defined state, not an error.

7. **Semantic clustering = v2.** The residual v1 gap is *synonym rewording* of the same dish ("Garlic Butter Pasta" vs "Buttery Garlic Pasta" normalize differently). Embedding-based near-duplicate clustering closes it in v2; v1 is honest exact-concept de-dup.

**Schema dependency:** adds `dishType` to the recipe schema ([ADR-0003](./0003-ingredient-and-recipe-schemas.md), amended). The earlier `primaryProtein` idea is dropped.

## Architecture

### Signature
```
signature(recipe) = hash( normalizeTitle(recipe.title) )

normalizeTitle(t) =
  t.toLowerCase()
   .replace(/[^a-z0-9 ]/g, '')
   .split(/\s+/)
   .filter(w => !STOPWORDS.has(w))        // the, a, of, with, and, in, on, …
   .sort()
   .join(' ')
```
`dishType` is used for prompt steering and optional within-batch variety — **not** part of the exact signature.

### Refresh loop (data flow)
```
client exclusion  = { signatures[], recentTitles[], dishTypes[] }   (accumulated this session)
   │  POST /recipes { ingredients, servings, exclude, prefs? }
   ▼
server
   prompt += "already shown: <recentTitles> / <dishTypes> — return 5 NEW styles, avoid these"
   request ~6–7 recipes (response-format)
   for each recipe: sig = signature(recipe)
   drop if  sig ∈ exclude.signatures   OR   sig duplicates another in this batch
   if survivors < 5 and rounds < 2 → backfill call for the shortfall
   return survivors (≤ 5)
   ▼
client
   render; if < 5 → exhaustion state
   append survivors' signatures (+ titles, dishTypes) to the exclusion list
```

### API boundary
`POST /recipes` body gains:
```ts
exclude: {
  signatures: string[]    // FULL list — server-side hard filter only (never sent to the model)
  recentTitles: string[]  // bounded window (~15) — prompt hint
  dishTypes: string[]     // compact set — prompt hint
}
```
Response shape is unchanged (`{ recipes }`). The signatures list can grow large without prompt cost because it's used only for filtering, not put in the prompt; only the bounded `recentTitles`/`dishTypes` reach the model.

## Consequences

### Positive
- **Avoids the false-positive trap** — fingerprints concept, not the constant ingredient set.
- **Deterministic hard guarantee** against exact repeats, while the *model* produces the perceptible variety.
- **Stateless backend** — client-authoritative exclusion can never desync from server state.
- **Refresh is bounded** (never hangs) and exhaustion is honest, not faked.

### Negative
- **Reload resets** the session's no-repeat memory (client-authoritative trade-off).
- **Synonym-reworded near-dupes can slip** in v1 — the explicit v2 (semantic) gap.
- The exclusion **signatures list grows** over a long session; the in-prompt hint is bounded (recent window + dish-type set), so prompt cost stays flat even as the filter list grows.

### Neutral
- `dishType` added to the recipe schema; `primaryProtein` dropped.
- Over-generation count (~6–7) and the backfill cap (2) are tunable knobs.

## Alternatives Considered

### Ingredient/protein-based structured signature
- Pros: fingerprints "what's in it."
- Cons: every recipe shares the constant ingredient set → mass **false positives**, blocking legitimate variety.
- Why not: wrong axis — it weights the constant, not the variable.

### Server-side session store for the exclusion list
- Pros: survives client reload.
- Cons: stateful backend, more infra, can desync.
- Why not: client-authoritative is simpler and can't desync; reload-reset is an acceptable v1 caveat.

### In-prompt exclusion only (no hard filter)
- Pros: no post-filtering.
- Cons: not a guarantee — models drift and repeat; also bloats the prompt as the list grows.
- Why not: we keep the deterministic hard filter as the actual guarantee.

### Semantic / embedding de-dup now
- Pros: catches reworded near-duplicates.
- Cons: embeddings + threshold + more infra; heavier for a take-home.
- Why not: documented v2 lever; v1 is honest exact-concept de-dup.

## References
- [Product brief](../../product/2026-06-18-smart-recipe-planner.md) — riskiest assumption
- [ADR-0002](./0002-llm-pipeline-and-structured-output.md) — refresh re-runs stage 2 only; rules-in-code
- [ADR-0003](./0003-ingredient-and-recipe-schemas.md) — recipe schema (`dishType` added here)
- [Screen specs](../../design/screens.md) — Recipe List exhaustion state
