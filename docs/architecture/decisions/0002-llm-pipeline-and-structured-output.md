# ADR 0002: Two-stage LLM pipeline with response-format structured output

## Status

Accepted

## Date

2026-06-18

## Context

The core product is two AI jobs, not one: (1) read a photo of ingredients and **catalog** them (with counts), and (2) **generate 5 recipes** from a confirmed ingredient set, refreshable into a new non-repeating set. The prompt's hard constraint is "highly structured, not a chat" — every response the app renders must be reliable, typed data, never prose the client has to parse defensively.

Constraints shaping the decision:
- **Reliability** — a malformed recipe payload must never reach the UI. Parsing flakiness is unacceptable.
- **Human-in-the-loop** — the user confirms/corrects detected ingredients *before* recipes are generated (see [screen specs](../../design/screens.md) → Capture → Confirm).
- **Cost / latency** — a consumer app; we don't want to re-pay for vision on every refresh.
- **Take-home scope** — keep v1 simple and demoable; leave clear "productionize" levers.

## Decision

**Two separate LLM calls, each returning JSON-schema-constrained structured output, on Claude Sonnet 4.6.**

1. **Call 1 — Vision / catalog.** Photo(s) → a structured ingredient list with counts. Output is the data, validated against an *ingredient schema*.
2. **Call 2 — Recipe generation.** The user-**confirmed** ingredient list (+ servings, prefs, and an exclusion list) → exactly 5 recipes, validated against a *recipe schema*.

Key choices:
- **Model: `claude-sonnet-4-6`** for both calls in v1 — strong vision + structured output, good speed, sensible price ($3 / $15 per 1M in/out). See [ADR-0002 alternatives](#alternatives-considered) for the Opus / Haiku trade-offs and the documented cost lever.
- **Structured output via response format** (`output_config.format` with a JSON schema), **not tool use.** Both calls ask the model to *return data*, not to *take an action* — the response itself is the deliverable, so a JSON-schema-constrained response is the honest model. Tool use would invent a fake "function" whose only job is to catch the data, adding an agentic-loop layer we don't need. (Both approaches guarantee valid JSON; this is about modeling the problem, not reliability.)
- **Shape vs. rules split.** The schema guarantees *shape* (valid JSON, correct fields/types). It cannot guarantee *business rules* — "exactly 5," "no repeats," "no allergens" — because JSON-schema structured output doesn't support array-count or value constraints (the SDK strips them). Those rules are enforced **deterministically in backend code** after Call 2 responds. "The model proposes; our code disposes."
- **Refresh re-runs Call 2 only.** Vision runs once per photo session; "5 new recipes" re-invokes generation with a growing exclusion list. Vision is never re-paid on a refresh.

## Architecture

```
 App (Expo)                     Proxy (server — holds the AI key)         Claude (Sonnet 4.6)
 ──────────                     ─────────────────────────────────         ───────────────────
 photo(s) ───── POST /vision ─▶ build vision request ──────────────────▶  Call 1 · VISION
                              ◀── { ingredients:[{name,count?}] } ◀──────  response-format schema
        │
   CONFIRM screen  (edit chips · adjust counts · set servings)
        │  confirmed ingredients + servings (+ prefs)
        ▼
 ───────────── POST /recipes ─▶ build gen request + exclusion list ─────▶  Call 2 · GENERATE
                              ◀── { recipes:[ 5 ] } ◀───────────────────  response-format schema
                                 apply RULES in code:
                                   • exactly 5 (else backfill, capped)
                                   • no-repeat (drop by signature)        ── see no-repeat ADR
                                   • allergy-safe (reject + regenerate)   ── see allergy guard
        ▼
 Recipe List  ◀──── Refresh ──── POST /recipes (growing exclusion list) ─▶  Call 2 ONLY
```

### Data Flow
- **Call 1 in:** image bytes/base64. **out:** `{ ingredients: [{ name, count? }] }`.
- **Confirm:** client mutates the ingredient list and sets servings; nothing hits the model.
- **Call 2 in:** `{ ingredients, servings, exclude: [signatures], prefs? }`. **out:** `{ recipes: [Recipe × N] }` → code coerces to exactly 5, distinct, allergy-safe.
- **Refresh:** identical to Call 2 with an exclusion list that grows each press.

### API Boundaries
The app never talks to Claude directly — it calls the proxy (key stays server-side; see the forthcoming proxy ADR). Two endpoints:
- `POST /vision` — `{ images }` → `{ ingredients }`
- `POST /recipes` — `{ ingredients, servings, exclude, prefs? }` → `{ recipes }`

Both backend handlers own: schema construction, the model call, **validate-and-re-ask (one retry)**, and a typed error fallback (never a raw dump, never a blank screen). The `/recipes` handler additionally owns the rule layer.

### Testing Strategy
- **Unit (the high-value tests):** the rule layer — exact-5 enforcement/backfill, signature exclusion, allergy rejection — tested with *fixture* model outputs (pure logic, no live model). Per house testing contract: ≥1 happy-path + ≥1 error/edge case each.
- **Schema validation:** malformed/short payloads are rejected and trigger the retry/fallback path.
- **Integration smoke:** one thin real-model call per endpoint (doubles as the cheap-test spike), not in the unit suite.

## Consequences

### Positive
- **Two failure modes isolated.** Vision errors are caught/corrected at the confirm step *before* generation; recipe-gen always starts from clean, human-verified input.
- **Refresh is cheap and fast** — generation-only; no repeated vision cost.
- **Reliable rendering** — response-format kills the malformed-JSON class of bugs outright.
- **Clean cost lever** — the two calls can use different models (e.g. Haiku for vision) without touching the UI. Strong "productionize" story for the video.
- **Honest guarantees** — the rules the model *can't* promise live in deterministic code, which is testable and demoable.

### Negative
- **Two round-trips** for the first result (vision → confirm → generate) vs. one combined call. Acceptable: the confirm step is a desired product beat, not pure latency.
- **Backend owns real logic** (rules, retries) — more than a thin pass-through proxy. Justified; it's where the guarantees belong.

### Neutral
- Sonnet 4.6 is a starting point, swappable per call later (recorded as a lever, not a lock-in).
- Exact field-level schemas are deferred to **ADR-0003**.

## Alternatives Considered

### Alternative A: One combined call (photo → 5 recipes)
- Pros: one round-trip; less orchestration.
- Cons: no place for the human confirm step; a single vision slip silently corrupts the recipes; refresh would re-pay for vision every time.
- Why not: removes the load-bearing confirm beat and inflates cost/latency on the most-used action (refresh).

### Alternative B: Tool use instead of response format
- Pros: also guarantees schema-valid arguments.
- Cons: models an *action/function call* we don't have; adds an agentic-loop layer (tool_use → result → continue) for no benefit; more plumbing.
- Why not: our calls return *answers*, not actions. Response format is the direct, simpler fit.

### Alternative C: Opus 4.8 (max quality) or Haiku 4.5 (max cheap) as the single v1 model
- Opus 4.8 ($5/$25): highest quality but overkill and priciest for recipe generation.
- Haiku 4.5 ($1/$5): cheapest/fastest; lighter on nuanced recipe generation.
- Why not (for now): Sonnet 4.6 is the balance for v1. The documented lever is **Haiku for the vision-catalog call, Sonnet for generation** — adopt if cost matters at volume.

## References

- [Product brief](../../product/2026-06-18-smart-recipe-planner.md)
- [Screen specs](../../design/screens.md) — Capture → Confirm, Recipe List, Recipe Detail
- ADR-0003 (next) — ingredient + recipe schemas
- Claude API: `output_config.format` structured outputs; current model IDs/pricing (`claude-sonnet-4-6`, `claude-haiku-4-5`, `claude-opus-4-8`)
