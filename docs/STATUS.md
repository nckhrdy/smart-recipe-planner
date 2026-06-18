# Status / Handoff

Single entry point to pick up the project in a fresh session. Last updated: 2026-06-18.

## What this is
**Smart Recipe Planner** — an Expo (React Native) mobile take-home. Snap a photo of your ingredients → 5 structured recipes → Refresh for 5 new (non-repeating) → tap into the full recipe → save. Plus accounts + an allergy guard. **Not a chat interface.**

Read first: [product brief](./product/2026-06-18-smart-recipe-planner.md) · [screen specs](./design/screens.md) · [design tokens](../.claude/design-tokens.md) · [ADRs](./architecture/README.md).

## Decided
- **Persona:** tired ~6pm "what can I even make?" home cook.
- **Scope:** photo → confirm ingredients (counts, multi-photo, servings) → 5 recipes → refresh → detail → save. **Weekly Plan was cut** (scope).
- **Design:** cobalt `#3A41D6` on off-white `#F0E9DA`, Fredoka + Hanken Grotesk, strawberry backdrop. All 7 screens prototyped in `prototypes/`.
- **App platform:** Expo, run via **Expo Go** (no build / app store for the demo).
- **ADR-0002:** two-stage LLM pipeline (vision-catalog → confirm → recipe-generate), **Sonnet 4.6**, **response-format** structured output (not tool use); refresh re-runs stage 2 only; rules enforced in code.
- **ADR-0003:** ingredient schema `{name, count?}`; recipe schema with **structured quantities** `{name, amount, unit, note}` (live servings scaling) + `dishType`.
- **ADR-0004:** no-repeat = **normalized-title signature** (concept, not ingredients — ingredient-based signatures false-positive), **model-driven variety**, **client-authoritative** exclusion list, bounded backfill, honest exhaustion state. Semantic clustering = v2.
- **Infra:** **NOT AWS** — keep it as lightweight as possible (it's an interview app).

## OPEN — being rethought
**Backend hosting + auth + DB.** The one piece that must be hosted is a tiny **proxy** that holds the Anthropic key (can't ship in the app) and runs the two calls + rules. It also needs **Google/Apple auth** and **persistence** (prefs, allergies, saved recipes).

Last idea on the table (to rethink with fresh eyes): **Expo Go + Supabase** — Supabase Auth (Google/Apple) + Postgres + one Edge Function as the proxy (calls Claude via `fetch`). Nothing else hosted.

→ **Next step:** settle the lightest viable backend, then write the topology ADR (ADR-0005) and start scaffolding.

## Remaining after that
Scaffold Expo app + the proxy · build the flow · tests (jest-expo + @testing-library/react-native) · CI gate (lint → typecheck → test) · README + run instructions · the walkthrough video.

## Repo
Public: https://github.com/nckhrdy/smart-recipe-planner (note: the latest docs/ADRs may be uncommitted locally — `git status` to check).
