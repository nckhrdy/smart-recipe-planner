# ADR 0005: Backend topology — Expo app + Supabase (Auth + Postgres + Edge Function proxy)

## Status

Accepted

## Date

2026-06-18

## Context

[ADR-0002](./0002-llm-pipeline-and-structured-output.md) established that the app talks to a **proxy** — "the app never talks to Claude directly; the key stays server-side (see the forthcoming proxy ADR)." This is that ADR: it picks where the proxy lives and what else the backend must host.

One thing **forces** a server: the Anthropic API key. A mobile bundle is downloadable and decompilable, so any key shipped in the Expo app can be extracted and abused. The key must live somewhere we control and never reach the client.

The [product brief](../../product/2026-06-18-smart-recipe-planner.md) keeps full scope on purpose (it demonstrates design range beyond the literal prompt). That means the backend owns three jobs, not one:
- **Auth** — Google sign-in (no self-managed passwords). Apple Sign-In is **deferred** — it needs a paid Apple Developer account, which isn't worth it for an Expo Go demo; the design stays provider-agnostic so Apple is a later add, not a rewrite.
- **Persistence** — per-user prefs, allergies, and saved recipes.
- **Key-holding proxy** — the two Claude calls + the deterministic rule layer from ADR-0002 / [ADR-0004](./0004-no-repeat-across-refreshes.md).

Constraints shaping the decision:
- **Lightweight** — the stated goal is the fewest moving parts and vendors. "Lightweight" here means *managed surface area*, not *fewest features*.
- **Rigor** — key server-side, auth on every request, input validated at the boundary, least privilege on data (a user sees only their own rows). The bar is "systems, not demos."
- **Take-home logistics** — runs via **Expo Go** (no app-store build), free tiers only, and the submission needs a **deployed/live link**.

## Decision

**Two boxes: an Expo (React Native, TypeScript) app and a single Supabase project.** Supabase is the one hosted backend and covers all three jobs in one managed service.

```
 📱 Expo app (Expo Go)  ⇄  ☁️ Supabase  ── Auth + Postgres + Edge Function ──▶ 🤖 Claude
```

1. **Frontend — Expo (RN + TS).** The app on the phone. Camera/roll via `expo-image-picker`, navigation via `expo-router`. It calls Supabase for auth + data, and the Edge Function for the AI pipeline. **It holds no secrets** — only the Supabase *anon* (publishable) key, which is safe in clients because every data path is gated by Row-Level Security.

2. **Auth — Supabase Auth (Google OAuth).** Issues a JWT on sign-in. Native Google sign-in yields an identity token that is exchanged for a Supabase session. Every backend call carries `Authorization: Bearer <supabase-jwt>`. Provider list is config, not architecture — adding Apple later is a Supabase setting + a sign-in button, not a redesign.

3. **Persistence — Supabase Postgres, guarded by Row-Level Security (RLS).** Relational tables for profile/prefs/allergies and saved recipes. RLS policies (`user_id = auth.uid()`) make it impossible for one user to read another's rows — authorization lives in the database, not in client code.

4. **Proxy — one Supabase Edge Function** implementing the ADR-0002 endpoints (`/vision`, `/recipes`). It is the **only** place the Anthropic key exists (a Supabase secret), it **verifies the caller's Supabase JWT before calling Claude** (so it's an authenticated proxy, not an open relay), and it owns the rule layer (exactly-5 / no-repeat / allergy-safe). This co-locates the rules with the key, exactly where ADR-0002 placed them.

**Net:** one frontend, one backend vendor, one secret, one place that talks to Claude.

## Architecture

```
 📱 Expo app (phone, Expo Go)                ☁️ Supabase project                       🤖 Claude
 ───────────────────────────                 ──────────────────────────────────        ──────────
 sign in (Google) ─────────────────────────▶ Auth ── issues JWT ──┐
                                                                   │ Bearer <jwt> on every call
 read/write prefs · allergies · saved ─────▶ Postgres + RLS  ◀─────┘  (user sees only own rows)
   (Supabase JS client, anon key)              user_id = auth.uid()

 POST /functions/v1/vision   {images} ──────▶ Edge Function ── verify JWT ──▶ Call 1 · VISION
                                       ◀────── { ingredients } ◀────────────  (response-format)
        │  CONFIRM screen (edit chips · counts · servings)
        ▼
 POST /functions/v1/recipes  {…,exclude}────▶ Edge Function ── verify JWT
                                              build gen request ─────────────▶ Call 2 · GENERATE
                                              apply RULES in code:            (response-format)
                                                • exactly 5 (backfill, capped)
                                                • no-repeat (signature drop)   ── ADR-0004
                                                • allergy-safe (reject+regen)  ── allergy guard
                                       ◀────── { recipes } ◀───────────────────
        ▲                                      ANTHROPIC_API_KEY = Supabase secret (never in client)
        └── Refresh ── POST /recipes (growing exclusion list) ── Call 2 only
```

### Data Flow
- **Auth:** native Google/Apple → identity token → Supabase session (JWT). The JWT rides on every subsequent request.
- **Prefs / allergies / saved recipes:** the Expo app uses the Supabase JS client (anon key) to read/write Postgres directly; RLS scopes every query to `auth.uid()`. The Edge Function is **not** in this path — CRUD doesn't need the AI key.
- **AI pipeline:** the app calls the Edge Function (`/vision`, then `/recipes`). The function verifies the JWT, calls Claude (key from secret), runs the rule layer, returns typed data. Refresh re-hits `/recipes` only (per ADR-0002).
- **Allergy guard input:** the user's allergy list is read from Postgres and passed to `/recipes`; the deterministic reject/regenerate runs in the Edge Function.

### Data model (Postgres)
```sql
profiles      ( user_id uuid pk → auth.users, cuisines text[], diets text[], allergies text[], updated_at )
saved_recipes ( id uuid pk, user_id uuid → auth.users, recipe jsonb, title text, dish_type text, created_at )
-- RLS on both: USING ( user_id = auth.uid() )  for select/insert/update/delete
```
`recipe jsonb` stores the ADR-0003 recipe object verbatim — saved keepers must survive even if the schema evolves, and we never re-query Claude to re-render a saved recipe.

### API Boundaries
- **App → Postgres** (Supabase client, anon key, RLS-gated): `profiles`, `saved_recipes` CRUD.
- **App → Edge Function** (JWT required), unchanged from ADR-0002:
  - `POST /vision` — `{ images }` → `{ ingredients }`
  - `POST /recipes` — `{ ingredients, servings, exclude, prefs?, allergies? }` → `{ recipes }`
- **Edge Function → Claude:** response-format structured output (ADR-0002), key from `ANTHROPIC_API_KEY` secret.

The Edge Function validates every request body at the boundary (shape, sizes, image count/encoding) and returns typed errors — never a raw dump, never a blank screen (consistent with ADR-0002's validate-and-re-ask + fallback).

### Testing Strategy
- **Unit (high-value):** the rule layer inside the Edge Function — exact-5 backfill, signature exclusion, allergy rejection — against fixture model outputs (pure logic, no live model). Per house contract: ≥1 happy-path + ≥1 edge case each.
- **RLS policy tests:** a second user cannot read/write the first user's `profiles` / `saved_recipes` rows (authorization is data-layer, so it gets tested there).
- **Boundary validation:** malformed bodies / oversized or missing images are rejected with typed errors; missing/invalid JWT → 401.
- **Integration smoke:** one thin real-model call per endpoint (doubles as the cheap spike), kept out of the unit suite.

## Consequences

### Positive
- **One vendor, one secret, one Claude caller.** Lightweight as defined: minimal managed surface despite full feature scope.
- **Auth + DB are managed** — no password storage, no session plumbing; Google/Apple handled by Supabase Auth.
- **Authorization lives in Postgres (RLS)** — least privilege by construction; the anon key is safe in the client because it can't escape RLS.
- **Key is isolated** — exists only as an Edge Function secret; the authenticated proxy is not an open relay, which bounds abuse/cost.
- **Rules co-locate with the key** — the Edge Function is the natural home for ADR-0002's rule layer; no new component.
- **Deployable link is free** — Edge Functions get public HTTPS URLs (the deployed backend); the Expo app ships via a published Expo Go link (and optionally an Expo web build). Satisfies the submission's live-link requirement.

### Negative
- **Vendor lock-in to Supabase** — auth, DB, and functions are coupled to one platform. Acceptable for a take-home; the Edge Function logic is portable (plain TS + `fetch` to Anthropic) if we ever migrate.
- **Edge Functions run Deno, not Node** — Claude is called via `fetch` (or the Anthropic SDK over an `npm:`/esm specifier), and cold starts add some first-call latency. Minor; the rule layer is plain TS.
- **OAuth setup overhead** — Google still needs OAuth credentials wired into Supabase + the Expo client (`expo-auth-session` / Google). One provider, so this is small. **Apple is deliberately out for v1** (paid Apple Developer account) — a documented gap, re-addable without redesign.

### Neutral
- CRUD bypasses the Edge Function by design (RLS makes a proxy redundant for data) — only the AI path is proxied.
- Free-tier limits (function invocations, DB rows) are far above demo needs; a scale concern, not a v1 one.
- Supabase Realtime / Storage exist but are unused in v1 (no live sync, images aren't persisted server-side).

## Alternatives Considered

### Alternative A: Stateless function host (Vercel / Cloudflare) + separate Auth + separate DB
- Pros: each piece best-in-class; the proxy is trivially a single function.
- Cons: **three vendors** to wire (function host + Clerk/Auth0 + Neon/Planetscale), three sets of config/secrets, more integration glue.
- Why not: directly opposes the lightweight goal. Vercel-style hosting only wins when there's *no* auth/DB to host — which was the stripped-scope path we rejected.

### Alternative B: Firebase (Auth + Firestore + Cloud Functions)
- Pros: also one vendor; mature Google/Apple auth; generous free tier.
- Cons: Firestore is NoSQL (weaker fit for relational prefs/saved-recipe queries and per-row authorization than Postgres + RLS); Cloud Functions require enabling billing; tighter Google-ecosystem coupling.
- Why not: Postgres + RLS is the cleaner, more testable relational + authorization story, and we already reason in SQL. Close second.

### Alternative C: Self-hosted Node proxy (Express on Render/Fly) + roll-our-own auth
- Pros: full control; plain Node (no Deno caveat); any DB.
- Cons: most to build and operate — auth, sessions, DB provisioning, deploy, secrets — exactly the surface Supabase removes.
- Why not: defeats "lightweight"; reinvents managed primitives for no take-home benefit.

### Alternative D: No server — key in the Expo app
- Pros: nothing to host; fastest to a first call.
- Cons: ships a extractable secret, no real auth, no shared data — the rigor red-flag a reviewer catches immediately.
- Why not: violates the non-negotiable (key server-side) and the global security standard (never hardcode secrets).

## References
- [Product brief](../../product/2026-06-18-smart-recipe-planner.md) — full scope (sign-in, accounts, allergy guard, saved recipes)
- [ADR-0002](./0002-llm-pipeline-and-structured-output.md) — the proxy + `/vision`,`/recipes` endpoints this ADR hosts; rules-in-code
- [ADR-0003](./0003-ingredient-and-recipe-schemas.md) — recipe object stored as `jsonb` in `saved_recipes`
- [ADR-0004](./0004-no-repeat-across-refreshes.md) — client-authoritative exclusion list sent to `/recipes`
- Supabase: Auth (Google/Apple OAuth), Postgres Row-Level Security, Edge Functions (Deno), secrets
- Expo: `expo-router`, `expo-image-picker`, `expo-auth-session` (Google); Expo Go demo flow
