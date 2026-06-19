# Smart Recipe Planner — *Always Hungry*

Snap a photo of the ingredients you have on hand and get **5 structured recipes** you can cook tonight. Don't like them? **Refresh** for a genuinely new set (no repeats). Tap into any recipe for the full method, scale the servings, and **save** the keepers. Set your **allergies** once and they're kept out of every recipe — a deterministic, server-side safety check.

A mobile app built with **Expo** (React Native + TypeScript). **Not a chat interface** — the recipe list and the recipes themselves are highly structured.

**▶ Live demo:** https://smart-recipe-planner-lime.vercel.app
**▶ Walkthrough video:** Please see Ashby submission

> **Using the live demo:** tap **Continue with Google** to sign in, or use **Skip** on the sign-in screen to jump straight in without an account. On the web demo, "snap ingredients" opens your device's photo/camera picker (a browser can't drive the native camera — see [Platform notes](#platform-notes)). For the true native camera experience, run it on a phone via Expo Go (below).

---

## What it does

1. **Capture** — take/stage one or more photos of your ingredients (fridge, pantry, counter). They scan together.
2. **Confirm** — a human-in-the-loop step: vision-detected ingredients appear as editable chips (with counts); remove wrong ones, or add more from a tap-to-pick list (or type your own). Set how many you're cooking for.
3. **Five recipes** — structured cards (prep/cook/serves, a one-line hook, an ingredient peek). **Refresh** generates 5 new, non-repeating ideas; the set "exhausts" honestly when the ingredients are tapped out.
4. **Detail** — full recipe on its own screen: stat strip, a collapsible cook timer, a plain ingredient list with a **live servings stepper** (quantities recompute), and a numbered method.
5. **Save & personalize** — bookmark recipes into *My Recipes*; set cuisines/diet (soft bias) and **allergies** (hard guard) in Profile or the onboarding quiz.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| App | **Expo SDK 54**, React Native 0.81, **TypeScript** (strict), expo-router (typed routes) | One codebase → iOS, Android, **and web** (the deployed link). Pinned to SDK 54 for Expo Go compatibility. |
| State | **Zustand** (+ persist) | Tiny, ergonomic stores for the photo→recipes session, saved recipes, and prefs. |
| UI | react-native-svg, expo-image, custom token system | Brand backdrop + doodles + the cook-timer ring; a single design-token source. |
| Backend | **Supabase** — Auth (Google OAuth), Postgres + **Row-Level Security**, Edge Functions (Deno) | One vendor for auth + data + a key-holding API proxy. RLS = authorization lives in the DB, not the client. |
| AI | **Anthropic Claude** via an Edge Function proxy | **Haiku 4.5** for fast recipe generation, **Sonnet 4.6** for accurate vision. The API key lives only as a function secret. |

## Architecture

A two-stage LLM pipeline behind a thin proxy, with the *rules* (safety, no-repeat) in deterministic code rather than the prompt:

- **`/vision`** → detects ingredients from photos (Sonnet 4.6, structured output).
- **`/recipes`** → generates 5 structured recipes (Haiku 4.5, structured output), then a **code** layer enforces the hard **allergy guard** (synonym-aware) and **no-repeat** (normalized-title signatures, client-authoritative exclusion).
- The app talks to Postgres directly for CRUD (RLS-gated by `auth.uid()`); only the AI path is proxied so the Anthropic key never reaches the client.

Decision records: [`docs/architecture/`](docs/architecture/) —
[two-stage pipeline & structured output (0002)](docs/architecture/decisions/0002-llm-pipeline-and-structured-output.md) ·
[ingredient/recipe schemas (0003)](docs/architecture/decisions/0003-ingredient-and-recipe-schemas.md) ·
[no-repeat across refreshes (0004)](docs/architecture/decisions/0004-no-repeat-across-refreshes.md) ·
[backend topology (0005)](docs/architecture/decisions/0005-backend-topology-expo-supabase.md).

## Repo structure

```
mobile/      # Expo app (React Native + TypeScript) — the client
supabase/    # Edge Functions (Deno) + the Postgres migration (RLS)
docs/        # product brief, ADRs, design specs, setup guides, QA, gate reports
prototypes/  # HTML design prototypes (the visual source of truth)
```

## Run it

### Easiest: the live link
Open **https://smart-recipe-planner-lime.vercel.app** — no setup. Sign in with Google or tap **Skip**.

### On a phone (native camera) — Expo Go
```bash
cd mobile
npm install
npx expo start -c          # scan the QR with Expo Go (App Store version = SDK 54)
```
The sign-in screen's **Skip** opens the app immediately; set allergies/prefs in the Profile tab.

### On web, locally
```bash
cd mobile
npm install
npx expo start --web                 # dev server
# or a production build:
npx expo export --platform web       # outputs ./dist (what Vercel serves)
```

### Point it at your own Supabase (optional)
1. Create a Supabase project.
2. Apply the schema: run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (`supabase db push` or the SQL editor).
3. Set the AI key as a function secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-…`
4. Deploy the functions: `supabase functions deploy vision recipes --project-ref <your-ref>`
5. `cp mobile/.env.example mobile/.env` and fill `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
6. For Google sign-in, follow [`docs/auth-setup.md`](docs/auth-setup.md).

## Test it

```bash
# Server rule/unit tests (allergy guard, no-repeat signatures) — 14 Jest tests
cd supabase && npm test

# App: type-check + lint
cd mobile && npx tsc --noEmit && npx expo lint

# Edge Functions: type-check (Deno)
deno check supabase/functions/vision/index.ts supabase/functions/recipes/index.ts
```
Manual QA checklist: [`docs/testing/manual-qa.md`](docs/testing/manual-qa.md).

## Platform notes

- **Camera:** native (Expo Go / a build) uses the device camera; on **web**, browsers can't open the native camera, so capture falls back to the photo/file picker (which offers "Take Photo" on mobile browsers).
- **Auth:** Google OAuth works on the deployed web URL (stable https redirect). In Expo Go the OAuth redirect is bound to the dev machine's IP, so the **Skip** shortcut is the way in there. Sign-in/quiz/profile-sync are bonus scope on top of the required flow; the core experience needs no account.

## Known limitations / next steps

- **Rate limiting** on the AI Edge Functions (a public deploy exposes the URL + anon key — RLS protects data, but the AI proxy could be abused; add per-IP/user limits before a real launch).
- **No mobile-side test suite** yet (server rules are tested); pure logic like servings-scaling is the first thing to cover.
- **Session is client-authoritative** — a full reload resets the current recipe list (saved recipes persist). A documented v1 trade-off (ADR-0004).

## More docs

[Status / handoff](docs/STATUS.md) · [Product brief](docs/product/2026-06-18-smart-recipe-planner.md) · [Design tokens](.claude/design-tokens.md) · [Screen specs](docs/design/screens.md) · [Auth setup](docs/auth-setup.md)
