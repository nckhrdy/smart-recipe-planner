# Code Review: feat/scaffold-expo-supabase (design polish + auth/quiz)

**Date:** 2026-06-19
**Stack:** Expo SDK 54 (React Native 0.81, expo-router), TypeScript (strict), Zustand, Supabase, react-native-svg
**Files changed:** ~33 (23 modified, ~10 new)
**Verdict:** PASS

## Summary
Design-polish pass rebuilding every screen to the prototypes, plus platform-aware Google auth, the onboarding quiz, and `profiles`-table sync. Code follows the established token/`AppText`/`Screen` patterns, is strictly typed (tsc + lint clean), and aligns with ADR-0003 (servings scaling) and ADR-0005 (Supabase auth + owner-scoped RLS). No blocking issues; findings are quality/test-coverage gaps, not bugs.

## Findings

| Severity | File:Line | Issue | Suggestion |
|----------|-----------|-------|------------|
| WARN | mobile/src/components/ui/{section,placeholder}.tsx | Dead code — both are now unused after the screen rewrites. | Delete (guard blocks `rm`; run a `!`-prefixed remove). |
| WARN | mobile/src/lib/identity.ts:18 | The `DEMO` identity ("Nick Hardy / nick@example.com") renders for any **unauthenticated** user — i.e. anyone who taps "Skip" on the public web demo sees a hardcoded signed-in person. Mildly misleading to a reviewer. | Show a neutral "Guest" identity when access came via the dev skip (no real session); keep DEMO only for local dev. |
| WARN | mobile/src/app/(app)/(tabs)/profile.tsx:30 | Pref edits write through to Supabase on **every** chip tap (`update` → `saveProfile`) — chatty, N upserts for a multi-select. | Debounce (~500ms) or persist on row-collapse / screen-blur. |
| WARN | mobile/src/app/(app)/recipe/[id].tsx (scaleParts), confirm/session/profile | New pure logic + data helpers ship without unit tests (mobile has `@testing-library/react-native` but no specs). `scaleParts`/quantity-scaling is deterministic and bug-prone (rounding) — worth covering. | Add a small jest spec for `scaleParts` (and ideally `profile.ts` happy/empty paths). |
| NOTE | mobile/src/**/*.tsx (styles) | Many literal px sizes (13.5, 12.5, 23, 33, 34…) in StyleSheets instead of the `fontSize`/`space` token scale — done to match the prototypes pixel-for-pixel, but it drifts from the token system the project prides itself on. | Extend the type scale with the values actually used, or accept the drift and note it. |
| NOTE | mobile/src/lib/{profile,session}.ts | Profile sync failures are fire-and-forget to `console.warn` — silent to the user. | Acceptable (local store is source of truth); consider a toast on persistent failure. |
| NOTE | mobile/src/components/recipe-card.tsx | Component carries two layouts (full/compact) in one file — fine now, but watch for growth. | Split if a third variant appears. |

## Systemic Issues
- **No mobile-side test suite.** Server rules are well-tested (`supabase/functions/_shared/rules.test.ts`), but the app has zero specs. Not introduced by this PR, but the gap widened with new logic (scaling, identity, profile sync). Recommend at least pure-function coverage before "production".
- **Token vs. prototype tension.** `design-tokens.md` declares a strict type scale, yet screens hardcode many off-scale px values to hit prototype fidelity. Decide which is authoritative and reconcile (the doc already concedes the prototypes are the visual source of truth).

_None of the above blocks merge for a take-home deliverable; they're the honest "what I'd tighten next" list (good video trade-offs material)._
