# Architecture Decision Records

Structural decisions for the Smart Recipe Planner — the choices that are hard to change later (model, data flow, service boundaries, schemas). One decision per file in [`decisions/`](./decisions/), MADR-style. `0001` is the template; real ADRs start at `0002`.

## Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [0001](./decisions/0001-adr-template.md) | ADR Template | Template | – |
| [0002](./decisions/0002-llm-pipeline-and-structured-output.md) | Two-stage LLM pipeline + response-format structured output (Sonnet 4.6) | Accepted | 2026-06-18 |
| [0003](./decisions/0003-ingredient-and-recipe-schemas.md) | Ingredient and recipe schemas (structured quantities) | Accepted | 2026-06-18 |
| [0004](./decisions/0004-no-repeat-across-refreshes.md) | No repeats across refreshes (title signature + model-driven variety) | Accepted | 2026-06-18 |

## Core principles
- **Highly structured, never chat** — every rendered response is typed, schema-validated data.
- **The model proposes; our code disposes** — schemas guarantee shape; deterministic code guarantees the rules (exactly 5, no-repeat, allergy-safe).
- **Isolate failure modes** — vision and generation are separate calls with a human confirm step between them.
- **Keep the key server-side** — the app never calls Claude directly.

*Last updated: 2026-06-18*
