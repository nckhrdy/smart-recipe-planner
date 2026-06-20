# Security Audit: fix/recipe-ux-and-ingredient-enforcement

**Date:** 2026-06-19
**Files audited:** 10 (scope: `docs/readme..HEAD` — this branch's commit; `main` is stale so its merge-base diff is the whole app and not the audit target)
**Verdict:** PASS

## Summary
No CRITICAL/HIGH/MEDIUM findings. The branch adds a deterministic ingredient-containment gate (pure string ops, no I/O), UI components, and a web label fix — none of which open an attack surface. No dependency changes, no hardcoded secrets, no user-controlled regex, and the one server handler in scope (`recipes/index.ts`) validates input at the boundary. The containment gate actually *narrows* the blast radius of model misbehaviour by rejecting recipes that reach beyond confirmed ingredients.

## Findings

| Severity | OWASP | File:Line | Finding | Remediation |
|----------|-------|-----------|---------|-------------|
| LOW | A03/A04 | supabase/functions/recipes/index.ts:36 | User-supplied ingredient names / prefs are interpolated into the LLM prompt (prompt-injection surface). Pre-existing; unchanged by this branch. | Already mitigated: structured-output schema constrains the response shape, and the new `filterByAvailable` + allergy guard discard off-list/unsafe results deterministically. No action required for this PR. |

## Detail / things checked clean
- **A03 Injection (regex/ReDoS):** The two `new RegExp(...)` calls in `rules.ts` (lines 89, 107) are pre-existing and wrap input in `escapeRegExp`. The new `foodTokens` tokenizer uses a static literal regex (`/[^a-z ]/g`) — no user-controlled pattern, no ReDoS introduced.
- **A03 XSS:** Recipe text renders through React Native `<AppText>` (and React on web), which escapes by default. No `dangerouslySetInnerHTML`, no raw HTML.
- **A04 Insecure design / input validation:** `parseRequest` validates at the boundary — array non-empty, each `name` a non-empty string, `strList` filters non-strings, counts coerced to positive ints. The new `availableNames` is derived from this already-validated set. The custom-minutes timer input is validated client-side (digits only, clamped 1–999).
- **A01 Access control / CORS:** Unchanged; `CORS_HEADERS` and auth wiring not touched.
- **A02 Crypto / secrets:** No keys, tokens, or credentials in the diff (regex scan clean). `wordmark.png` is image data only.
- **A06 Vulnerable components:** No `package.json` / lock-file changes — `npm audit` not applicable to this branch.
- **A09 Logging:** No new logging; no PII/secrets emitted.
- **A10 SSRF:** No new outbound requests from user-controlled URLs; image picker returns local base64 assets.

## Dependency Audit
No dependency changes — `package.json` / lock files untouched. `npm audit` not run for this branch.

## CVE References
None applicable.

---

## Follow-up audit — diet guard + containment fix + docs (2026-06-19)

**Files audited:** 8 (the 2 unpushed commits `a3cdc4a`, `6b6294e`). **Verdict:** PASS — no CRITICAL/HIGH/MEDIUM.

Covers the later delta: the `DERIVED_PRODUCT_TERMS` containment fix, the diet guard (`findDietConflict`/`filterByDiet`/`isDietExcludedIngredient`) + `mobile/src/lib/diet.ts` + `saved.tsx`, and the committed docs (README, `architecture.html`, review report).

### Findings
No new findings. The pre-existing prompt-injection **LOW** (recipes/index.ts) still stands and is unchanged.

### Things checked clean
- **A03 Injection / ReDoS:** The diet guard and containment fix use static `Set` membership and the static tokenizer regex `/[^a-z ]/g` — **no user-controlled `RegExp`** added. `diet.ts` is the same per-word matching with literal patterns. No new dynamic regex anywhere in the diff.
- **A03 XSS:** `diet.ts` / `saved.tsx` render through React Native `<AppText>` (auto-escaped); no `dangerouslySetInnerHTML`. `architecture.html` is a standalone **documentation** file, not served by the app or bundled into it — it can't reach app users.
- **A02 Crypto / secrets:** Regex secret scan over the full diff and a targeted scan of `README.md` + `architecture.html` for `sk-ant-`/`sb_secret_`/`service_role`/JWT patterns — **clean**. `architecture.html` only references public Google Fonts (preconnect/stylesheet); no inline credentials, no data-exfil script.
- **A04 Input validation:** `recipes/index.ts` diet wiring consumes `prefs.diets` already filtered by `strList` in `parseRequest`; `availableNames` still derives from the validated, allergen/diet-stripped set. Boundary validation intact.
- **A06 Vulnerable components:** No `package.json` / lock-file changes — `npm audit` not applicable.
- **A09 / A10:** No new logging of PII/secrets; no new outbound requests from user-controlled URLs.

### Note (carryover, not introduced here)
Rate limiting on the AI Edge Functions remains the top pre-production item (A04, MEDIUM in spirit) — it is **pre-existing**, not part of this diff, and is now documented as top priority in the README's "Known limitations & edge cases" section. Not a blocker for this push.
