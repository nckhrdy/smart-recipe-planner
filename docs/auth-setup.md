# Auth setup — Google sign-in

The client code is wired (ADR-0005): `signInWithGoogle` → in-app browser → deep-link
back → `setSession`. To make it actually work you must configure **Google Cloud** +
**Supabase** (the parts that can't live in the repo), then flip the dev bypass.

Supabase project ref: **`fndskgwfwdqeeiywdlez`** → callback URL is
`https://fndskgwfwdqeeiywdlez.supabase.co/auth/v1/callback`
(confirm against `EXPO_PUBLIC_SUPABASE_URL` in `mobile/.env`).

## 1 · Google Cloud — OAuth client
1. <https://console.cloud.google.com> → create/select a project.
2. **APIs & Services → OAuth consent screen** → *External* → fill app name + support
   email. Under **Test users**, add the Google account(s) you'll sign in with (lets you
   sign in while the app is unverified — no review needed for testing).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   *Web application*.
4. **Authorized redirect URIs** → add exactly:
   `https://fndskgwfwdqeeiywdlez.supabase.co/auth/v1/callback`
5. Save. Copy the **Client ID** and **Client secret**.

> Google only ever talks to Supabase's callback (https). It never sees the app's
> `exp://` / `smartrecipeplanner://` URL — Supabase does that final redirect — so this
> one web redirect URI is all Google needs.

## 2 · Supabase — enable Google
**Authentication → Providers → Google** → enable, paste the Client ID + Client secret, save.

## 3 · Supabase — allowlist the app redirect
**Authentication → URL Configuration → Redirect URLs**, add:
- **Dev build / standalone:** `smartrecipeplanner://` and `smartrecipeplanner://*`
- **Expo Go:** the `exp://…` URL printed by `npx expo start` (e.g. `exp://192.168.1.20:8081`).
  This changes with your network/IP, so re-add it when it changes — or use a dev build to
  avoid the churn (see note below).

Set **Site URL** to `smartrecipeplanner://` (or your web URL) while you're there.

## 4 · Turn off the dev bypass
In `mobile/.env`: `EXPO_PUBLIC_DEV_BYPASS_AUTH=false`, then restart: `npx expo start -c`.
Now the sign-in wall engages; after Google sign-in a **new** user hits the quiz, which
upserts to `public.profiles`. (Leave it `true` to keep developing without OAuth — the quiz
still runs once, just without server sync.)

## Expo Go caveat (read this)
Google OAuth works in Expo Go, but the redirect comes back over an IP-based `exp://` URL
you must allowlist each time it changes. For a smoother loop, build a **dev client** once —
`npx expo run:ios` (or EAS) — which gives the stable `smartrecipeplanner://` scheme; then
you only allowlist it once. (Heads-up: a dev build is **not** Expo Go and isn't pinned to
the App Store SDK-54 limit — keep that in mind vs. the project's Expo-Go constraint.)

## How the flow works
`signInWithOAuth({ provider: 'google', skipBrowserRedirect: true })` → open the returned URL
in `WebBrowser.openAuthSessionAsync(url, redirectTo)` → the redirect lands back in the app
(handled by the result **and** a `Linking` listener fallback) → tokens parsed →
`supabase.auth.setSession` → `onAuthStateChange('SIGNED_IN')` hydrates prefs from
`profiles` (existing user → skip quiz) or routes a new user into the quiz.

## Web deploy (Vercel) — where Google works for *everyone*
Expo Go's `exp://` redirect is bound to your dev machine, so Google sign-in there only
works for you. The **web deploy is the shareable path**: a stable `https://` origin that
Supabase handles cleanly. Sign-in is platform-aware in code — web does a full-page redirect
(`detectSessionInUrl`), native keeps the deep-link flow — so the same button works in both.

After your first Vercel deploy gives you a URL (e.g. `https://smart-recipe-planner.vercel.app`):
1. Supabase → **Redirect URLs**: add `https://<your-app>.vercel.app/**` (and `http://localhost:8081/**` for local web dev). The app sends its own origin as the redirect, so this just needs to match.
2. Supabase → **Site URL**: set it to `https://<your-app>.vercel.app` (replaces the localhost default).
3. **Google consent screen → publish to "In production"** so *any* Google account can sign in. With only basic email/profile scopes this needs **no** Google verification review (a reviewer may see a one-time "unverified app" notice they click past). Leaving it in **Testing** means only your added test users can sign in — fine if you just rely on the **Skip** button for everyone else.

Vercel env vars (Project → Settings → Environment Variables — needed at build time, they're inlined): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_DEV_BYPASS_AUTH=true` (keeps the "Skip" button as a no-friction fallback; set `false` for Google-only).

## Verify
Sign in → complete the quiz → in Supabase **SQL editor**: `select * from public.profiles;`
should show your row with the chosen cuisines / diets / allergies. Editing prefs on the
Profile tab updates the same row. On the Vercel URL, "Continue with Google" should bounce
through Google and land you back signed in (no localhost detour).
