# Security Audit: feat/scaffold-expo-supabase

**Date:** 2026-06-19
**Files audited:** design-polish + auth/quiz changeset (23 modified, ~10 new) — focus on `lib/session.tsx`, `lib/profile.ts`, `lib/supabase.ts`, `app/sign-in.tsx`, `app/onboarding.tsx`
**Verdict:** PASS

## Summary
No critical or high findings. Secrets handling is sound — real keys live only in gitignored `.env` / Supabase secrets, and `.env.example` is placeholders-only. Authorization is enforced server-side by Row-Level Security (`auth.uid() = user_id`), so the new `profiles` upsert can't be abused for IDOR. The notable items are a deliberate, documented dev auth-bypass that ships enabled on the demo, the absence of rate limiting on the AI Edge Functions, and inherited moderate dependency CVEs from the Expo SDK.

## Findings

| Severity | OWASP | File:Line | Finding | Remediation |
|----------|-------|-----------|---------|-------------|
| MEDIUM | A04/A07 | mobile/src/lib/session.tsx | Dev auth-bypass (`EXPO_PUBLIC_DEV_BYPASS_AUTH=true`) ships enabled on the web demo — "Skip" grants app access without auth. Acceptable for the demo (no sensitive data behind it; RLS still gates the DB; prefs are local), but must not ship in a real build. | Set `=false` for production; behavior is documented in `.env.example` + `docs/auth-setup.md`. |
| MEDIUM | A04 | supabase/functions/{vision,recipes} | No rate limiting on the AI Edge Functions. A public deploy necessarily exposes the URL + anon key, so the Claude-proxy endpoints are callable by anyone → potential cost-abuse (not data exposure; RLS still protects rows). Pre-existing, not introduced here. | Add per-IP / per-user rate limiting (or require a real user JWT) before any real launch. |
| MEDIUM | A06 | mobile/package-lock.json | 38 moderate transitive CVEs via the Expo SDK chain (`@expo/config-plugins` → `expo-constants` → `expo-asset`/`expo-auth-session`/`expo-linking`/`expo-splash-screen`). 0 high, 0 critical. Can't `audit fix` without bumping past the SDK-54 Expo Go pin. | Accept for the take-home; revisit on the next Expo SDK upgrade. |
| LOW | A08/A07 | mobile/src/lib/session.tsx (createSessionFromUrl + Linking listener) | A crafted deep link carrying attacker tokens could set a session (login-CSRF / session fixation). Low impact for this app (no payment/PII), and the implicit-flow pattern is Supabase's documented Expo approach. | Move to PKCE flow with `state` validation if hardening. |
| LOW | A09 | mobile/src/lib/session.tsx | `console.log('[auth] OAuth redirectTo', …)` logs a non-secret redirect URI; guarded by `__DEV__` so it's stripped from production bundles. | None required; remove if you want zero dev logging. |

## Secrets scan
PASS — `mobile/.env` is gitignored (verified via `git check-ignore`); `.env.example` holds empty placeholders + warning comments only; no `sk-ant-`, `sb_secret_`, `service_role`, `GOCSPX-`, private keys, or JWTs anywhere in the working tree or git history. The Supabase project ref / URL and anon (publishable) key are public by design (RLS-guarded) and are the only project identifiers in the repo (docs only).

## Dependency Audit
`npm audit` (mobile): **0 critical · 0 high · 38 moderate · 0 low.** All moderate, all transitive through the Expo SDK; unfixable without leaving SDK 54 (required for Expo Go). No new high/critical introduced by adding `react-native-svg`.

## CVE References
Transitive advisories are in the `@expo/config-plugins` dependency chain (moderate). No directly-actionable CVE for first-party code.
