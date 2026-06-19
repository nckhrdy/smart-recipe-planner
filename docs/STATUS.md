# Status / Handoff

Single entry point to pick up the project in a fresh session. Last updated: 2026-06-18.

## What this is
**Smart Recipe Planner** — an Expo (React Native, **SDK 54**) mobile take-home. Snap photo(s) of ingredients → 5 structured recipes → Refresh for 5 new (non-repeating) → tap into the full recipe → save. Plus on-device prefs + a deterministic **allergy guard**. **Not a chat interface.**

**Current state: the app is functionally complete and the backend is live.** The full flow works on a phone via Expo Go, calling deployed Supabase Edge Functions. Remaining work is **design polish + submission mechanics** (see "What's left").

Read first: [product brief](./product/2026-06-18-smart-recipe-planner.md) · [screen specs](./design/screens.md) · [design tokens](../.claude/design-tokens.md) · [ADRs](./architecture/README.md) · [manual QA](./testing/manual-qa.md).

## How to run
- **Phone (primary):** `cd mobile && npx expo start -c` → scan the QR in **Expo Go** (App Store version = SDK 54). Dev bypass is on → opens straight into the app.
- **Web (SPA):** press `w`, or `npx expo export --platform web` for a deployable build. `app.json` web `output: "single"`.
- **Function rule tests:** `cd supabase && npm test` (14 jest tests). **Type-check functions:** `~/.deno/bin/deno check supabase/functions/vision/index.ts supabase/functions/recipes/index.ts`.
- **Redeploy functions:** `supabase functions deploy vision recipes --project-ref fndskgwfwdqeeiywdlez` (CLI is logged in on this machine).

## Architecture (ADRs — all Accepted, in `docs/architecture/`)
- **0002** two-stage LLM pipeline, response-format structured output, rules-in-code. _Model lever updated from measured latency: **Haiku 4.5** for generation (fast Refresh), **Sonnet 4.6** for vision (accuracy)._
- **0003** ingredient `{name, count?}` + recipe with structured quantities `{name, amount, unit, note}` (live servings scaling) + `dishType`.
- **0004** no-repeat = normalized-title signature, model-driven variety, client-authoritative exclusion, bounded backfill, honest exhaustion. _Refined: client sends accumulated **titles**; server signatures them (logic in one place)._
- **0005** topology = **Expo app + one Supabase project** — Auth (Google-only v1, deferred) · Postgres+RLS · one Edge Function proxy holding the Anthropic key.
- **Platform:** Expo Go, **pinned to SDK 54** (App Store Expo Go max — don't let `expo install/upgrade` bump it). **NOT AWS.**

## What's built — all green (tsc · expo lint · deno check · 14 jest tests)
- **Backend** (`supabase/`): `0001_init.sql` (profiles + saved_recipes + owner-scoped RLS — **applied**). Edge Functions `vision` + `recipes` — **deployed** (project `fndskgwfwdqeeiywdlez`). `_shared/` = ADR-0003 schemas + rule layer (signature/no-repeat, allergy guard w/ synonym map, `isAllergenIngredient` input filter) + Claude wrapper (raw fetch, structured output, vision, retry). `ANTHROPIC_API_KEY` set as a Supabase function secret.
- **App** (`mobile/src/`): theme tokens + fonts + UI primitives (`AppText`, `Screen`, `Button`, `Stepper`, `IngredientChip`, `RecipeCard`, `SelectChips`, `Section`). `lib/` = supabase client, session/auth (w/ dev bypass), api (`functions.invoke`), `recipe-session`/`prefs`/`saved` zustand stores, capture helper, options. **All screens:** Home · Recipe List (+Refresh) · **Camera (staging tray → Scan N)** · Confirm (chips/counts/servings/+add/**Add photo**) · Recipe Detail (live scaling, method, save) · My Recipes (search/filter/unsave) · Profile (cuisines/diet/allergies) · Onboarding · Sign-in. Robust back button on pushed screens.
- **Verified live + manual QA passed** (`docs/testing/manual-qa.md`): /recipes → 5 distinct recipes ~15s; dairy-allergy → 5 dairy-free (allergen filter); multi-photo, no-repeat, servings scaling, save/unsave, airplane-mode error handling all working.

## Key operational facts
- **Dev bypass:** `EXPO_PUBLIC_DEV_BYPASS_AUTH=true` in `mobile/.env` skips the sign-in/onboarding wall (Google OAuth not wired yet). Set prefs/allergies from the **Profile** tab.
- **On-device storage:** saved recipes + prefs persist via AsyncStorage (the dev-bypass path); they sync to Supabase once Google auth lands.
- **`mobile/.env`** (gitignored): public Supabase URL + publishable key + the dev flag. The Anthropic key lives **only** as a Supabase function secret — never in the app/repo.
- **Tooling on this machine:** Supabase CLI (brew, logged in), Deno (`~/.deno/bin`).
- A full app reload resets the current recipe list; **saved recipes persist** — by design (ADR-0004, client-authoritative session).

## What's left (the roadmap)
1. **Design polish pass** ← NEXT (brief below).
2. **Web build → Vercel** — the hand-off / "deployed link" (web SPA ready; the live camera on web needs a file-pick fallback).
3. **README** — how to run/test the public repo (env setup: create Supabase project → run migration → set `ANTHROPIC_API_KEY` secret → deploy functions → fill `mobile/.env`).
4. **CI gate** — lint → typecheck → jest (functions) on push.
5. **Google OAuth** — wire it, then drop the dev bypass.
6. **Walkthrough video** (yours).
- ⚠ `npm audit` moderate transitive vulns (from the template) — run `/security` before push. Node v24.1.0 < Expo's preferred ≥24.3 (warnings only).

## Design polish brief (the immediate next task)
Screens use the right **tokens** but don't match the **mockups** (`prototypes/*.html`). Targets, per `prototypes/`, `design-tokens.md`, `screens.md`:
- **Strawberry backdrop** — `prototypes/assets/recipe-background.svg`, cobalt-masked at low opacity, behind opaque cards. Layer it into the `Screen` wrapper.
- **Bottom nav** — replace default tabs with a **custom bar + centered raised camera FAB** (cobalt circle, cream border): Home · Recipes · [FAB] · Saved · Profile.
- **Recipe cards** — match the prototype: "01" index, hook, meta row with cobalt line icons, ingredient pills / expand, a circular save button (cobalt-fill when saved).
- **Headers/heroes** — overline + big Fredoka **display** per screen; topbar wordmark + avatar where the design shows them.
- **Recipe List** — add the **ingredient context strip** (detected-ingredient chips + Edit) above the cards.
- Discipline: one orange action per screen; cards opaque over the backdrop. Decide the **wordmark/app name** (prototypes use placeholder "Pantry").
- Reference each screen's HTML: `home-screen`, `recipe-list-screen`, `recipe-detail-screen`, `capture-confirm-screen`, `my-recipes-screen`, `profile-screen`, `onboarding-screen`.

## Repo
Public: https://github.com/nckhrdy/smart-recipe-planner. Work is on branch **`feat/scaffold-expo-supabase`**, **uncommitted** (files are on disk — `git status` to see). `mobile/scripts/cleanup-template.sh` is a spent throwaway.
