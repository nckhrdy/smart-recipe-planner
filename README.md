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
(Requires .env vars. Please reach out for access to them)

### On web, locally
```bash
cd mobile
npm install
npx expo start --web                 # dev server
# or a production build:
npx expo export --platform web       # outputs ./dist (what Vercel serves)
```
(Requires .env vars. Please reach out for access to them)

### Point it at your own Supabase (optional)
1. Create a Supabase project.
2. Apply the schema: run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (`supabase db push` or the SQL editor).
3. Set the AI key as a function secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-…`
4. Deploy the functions: `supabase functions deploy vision recipes --project-ref <your-ref>`
5. `cp mobile/.env.example mobile/.env` and fill `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
6. For Google sign-in, follow [`docs/auth-setup.md`](docs/auth-setup.md).

## Test it

```bash
# Server rule/unit tests (allergy + diet guards, on-hand containment, no-repeat signatures) — 31 Jest tests
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

## Known limitations & edge cases

What's intentionally v1, and what a production build would harden. The rule layer is deliberately a **deterministic word heuristic** (`supabase/functions/_shared/rules.ts`) — fast, testable, and honest about its gaps — with a learned/embedding approach as the documented v2 lever.

### Edge cases in the rules layer
- **Allergen matching is prefix-based, so it can over-match.** An *egg* allergy matches `eggplant` (and would drop it from your ingredients); the prefix is deliberate so plurals like "peanuts" are caught. Fixing it means a small exception list, not a regex change. v2: an allergen→ingredient map / embeddings.
- **On-hand containment is word-matching, not semantic.** A recipe ingredient counts as "on hand" if it mentions an item you have or a pantry staple, with a denylist so a *processed product* isn't mistaken for the raw item (`tomato sauce` ≠ `tomato`). It can still err both ways — e.g. `lemon juice` is flagged off-list even if you have a lemon. v2: an embedding / ingredient-graph match.
- **Setting an allergy can shrink the recipe set.** Removing a keystone ingredient (eggs) from a small pantry leaves fewer buildable dishes, so you may see fewer than 5 recipes and the honest "you've explored these" state rather than padded ones (ADR-0004). Mitigation today: photograph a fuller pantry.
- **No-repeat is exact-concept de-dup.** Synonym-reworded dishes ("garlic butter pasta" vs "buttery garlic pasta") can still slip through within a session. v2: embedding-based near-duplicate clustering (ADR-0004).

### Production hardening (next steps)
- **Rate limiting on the AI Edge Functions.** A public deploy exposes the function URL + anon key — RLS protects *data*, but the AI proxy itself could be abused. Add per-IP / per-user limits and a cost ceiling before a real launch. **(Top priority.)**
- **No mobile-side test suite yet.** The server rule layer is covered by Jest; pure client logic like servings-scaling is the first thing to add.
- **Session is client-authoritative.** A full reload resets the current recipe list (saved recipes persist) — a deliberate trade-off to keep the backend stateless and desync-proof (ADR-0004). A server-side session store is the v2 path.
- **Apple Sign-In is deferred** (needs a paid Apple Developer account); the auth design is provider-agnostic, so it's a config add, not a rewrite (ADR-0005).
- **User photos aren't persisted.** Vision runs on the image, then it's discarded — no server-side storage of user photos in v1.

## More docs

[Status / handoff](docs/STATUS.md) · [Product brief](docs/product/2026-06-18-smart-recipe-planner.md) · [Design tokens](.claude/design-tokens.md) · [Screen specs](docs/design/screens.md) · [Auth setup](docs/auth-setup.md)
