# Manual QA — Smart Recipe Planner

A UI test pass for the core + expanded flows, run via Expo Go on a phone.
Reload first with a cleared cache: `cd mobile && npx expo start -c`.

**Legend:** ✅ pass · ⚠️ off but expected (see "Expected, not bugs") · ❌ bug → report.

---

## 0. Shell
- [ ] App opens straight to **Home** (no sign-in — dev bypass is on).
- [ ] All five tabs are tappable: Home, Recipes, Camera, Saved, Profile.

## 1. Capture → Confirm
- [ ] **Camera** tab → **Take a photo** (or **Choose from library**) of some ingredients.
- [ ] After a brief "Reading photo…", the **Confirm** screen opens with detected ingredient chips.
- [ ] Remove a wrong chip with the **×**.
- [ ] Adjust a **count** with −/+ on a chip that has one.
- [ ] Type a new ingredient and tap **+** — it appears as a chip.
- [ ] Set **Cooking for** (servings) with the stepper.
- [ ] Tap **Find 5 recipes** → ~15s "Cooking up five ideas…" → Recipe List.

## 2. Recipe List + Refresh (no-repeat)
- [ ] Exactly **5** recipes, each with title, one-line hook, total time, serves, a tag, and an index (01–05).
- [ ] The 5 are **different dish styles**, not 5 variations of one thing.
- [ ] Tap **Refresh — 5 new** → 5 recipes, **none repeating** the previous titles.
- [ ] Refresh a few more times → keeps producing new ones; eventually the **exhaustion note** appears ("You've explored these — add an ingredient or start a new photo").

## 3. Recipe Detail + servings scaling
- [ ] Tap a card → detail opens with title, hook, **prep / cook / total** strip, ingredients, numbered **method**.
- [ ] Change the servings stepper → ingredient **quantities scale** (e.g. 2 → 4 roughly doubles amounts; "to taste" items stay unchanged).
- [ ] Tap the **bookmark** to save; back out.

## 4. Save / My Recipes
- [ ] Save 2–3 recipes (bookmark on a card or in detail).
- [ ] **My Recipes** tab lists them; the header count matches.
- [ ] **Search** box filters by title/ingredient.
- [ ] Filter chips (All / Vegetarian / Under 30 min / Breakfast) narrow the list.
- [ ] Tap a filled bookmark to **unsave** → it disappears, count drops.
- [ ] Unsave everything → **empty state** ("No saved recipes yet").

## 5. Home
- [ ] Time-aware greeting (Good morning/afternoon/evening).
- [ ] **Recently saved** shows recipes you saved; **See all →** opens My Recipes.
- [ ] **Snap your ingredients** opens the Camera.

## 6. Allergy guard (the rigor test)
- [ ] **Profile** → **Allergies** → select **Dairy** (try **Shellfish** too).
- [ ] Generate/refresh recipes from ingredients that include cheese/dairy.
- [ ] Open a few recipes → **no dairy anywhere** in the ingredients. (Deterministic guard — even though the model was given dairy ingredients, none survive.)
- [ ] Optionally pick a **cuisine** (e.g. Italian) → recipes lean that way (a soft bias, not absolute).

## 7. Edge cases & error handling
- [ ] **Cancel** a photo (back out of the camera) → no crash, stays on Camera.
- [ ] On Confirm, remove **all** chips → **Find 5 recipes** is disabled.
- [ ] **Airplane mode** on → try to generate → a graceful error alert ("Could not generate recipes…"), no crash. Turn it back off.
- [ ] Full app **reload** (press `r` in the terminal) → saved recipes + prefs **persist**; the current Recipe List **resets to empty** (session memory resets on reload — by design).

---

## Expected, not bugs
- No **sign-in** or **onboarding** screens — the dev bypass skips them (they engage with real Google auth).
- **Sign out** in Profile does nothing visible yet (no real session).
- **Designs don't match the mockups** yet — the polish pass is pending (strawberry backdrop, centered-camera nav, card treatment).
- **~15s** wait on generate/refresh — that's the live model call.
- The **Recipe List empties after a full app reload** (saved recipes don't) — client-authoritative session, documented in ADR-0004.
