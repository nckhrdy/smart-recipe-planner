# Screen Specs — Smart Recipe Planner

**Status:** Living doc — extended as we design each screen
**Date:** 2026-06-18
**Author:** Nick Hardy
**Related:** [product brief](../product/2026-06-18-smart-recipe-planner.md)

Screen-level detail, kept separate so the product brief stays high-level. We design and prototype these one screen at a time.

---

## Capture → Confirm
**Designed:** `prototypes/capture-confirm-screen.html`. The camera step and the human-in-the-loop confirm, before any recipe generates.

**Capture (immersive, dark):** full viewfinder; shutter (center) + camera-roll thumbnail beside it (shoot *or* pick); flip camera.

**Confirm (cream):**
- **Multi-photo** — `Retake` and `Add photo` top-right; take/upload more and detected ingredients **merge** across photos (thumbnail strip shows the set; each removable).
- **Detected ingredients** as removable chips, with **counts** on countable items (Eggs ×6) the user can adjust.
- **+ Add** opens a curated tap-to-pick list — **no free text** (preserves the no-typing promise; trade-off: a very obscure item may not be listed).
- **"Cooking for"** servings stepper — the session default that sizes every recipe (pre-filled, e.g. 2). See servings note under Recipe Detail.
- One primary action: **Find 5 recipes** → Recipe List.

---

## Recipe List (`Recipe List` tab)
The 5 generated recipes from the latest photo, plus **Refresh** for a new (non-repeating) set.

**Each recipe card:**
- Recipe title
- Quick details: **prep time** and **cook time**
- **Save** button on the card itself — adds to My Recipes *without* opening the full recipe
- **Tap to expand** a short view of the required ingredients (a peek, without leaving the list)
- Tapping the card opens the **Recipe Detail**

**Refresh states** ([ADR-0004](../architecture/decisions/0004-no-repeat-across-refreshes.md)):
- **Empty** (before first photo) — "Snap something to get started," pointing at the camera.
- **Exhaustion** — when the ingredient set can't yield 5 genuinely-new recipes, show *"You've explored these — add an ingredient or start over."* A defined state, not an error.

**Deferred:** card thumbnails — text-only for now; revisit *after* the core flow works (idea: pull visuals from an open-source recipe/ingredient image set rather than generating them). **Open:** one-line hook under the title?

---

## Recipe Detail (shared screen)
Opened from Recipe List, My Recipes, or Home. Much more detail than the card. **Designed:** `prototypes/recipe-detail-screen.html`.

- Header: **back** (left) + **save to My Recipes** (right, fills cobalt when saved).
- Title + a one-line hook.
- Stat strip: **prep / cook / total time**.
- **Cook timer** — collapsed to a tappable button by default; tap to expand the ring + presets + Start. Generic, user-set duration (no per-step timers in v1).
- **Ingredients** — a plain list of name + quantity (no checklist).
- **Servings stepper** on the ingredients; changing it recomputes quantities (see note).
- **Numbered method.**

**Servings:** adjustable per-recipe here via the stepper. The *starting* number is a session default set on the **Confirm screen** after the photo — a fridge photo is a weak signal for headcount, so treat any image-derived guess as a default the user confirms, not a confident inference. (Confirm-screen servings UI: design when we build Capture → Confirm.)

**Resolved:** generic cook timer (user-set, collapsible); plain ingredient list; servings adjustable with quantity recompute. Saving = adding to **My Recipes** ("favorites" and "My Recipes" are one bucket).

---

## My Recipes (tab)
**Designed:** `prototypes/my-recipes-screen.html`. The saved keepers.

- Header (rounded display) + live saved count.
- **Search** + quick **filter chips** (All / Vegetarian / Under 30 min / Breakfast).
- **Compact recipe cards** — same card as the list minus the "01" index; a category tag, total time + serves, bookmark shown filled. Tap → Recipe Detail.
- **Un-save** via the filled bookmark (count updates).
- **Empty state** — "No saved recipes yet — tap the bookmark on any recipe…" with a "Find a recipe" CTA.

---

## Home (default tab)
**Designed:** `prototypes/home-screen.html`. The lean daily landing.

- Time-aware greeting in the rounded display.
- **Snap nudge** — a cobalt hero card ("What can you make tonight?") with the orange **Snap your ingredients** action → camera. The screen's one orange action.
- **Recently saved** — a couple of saved cards with **See all →** into My Recipes.
- Deliberately not a busy dashboard.

---

## Onboarding (first launch)
**Designed:** `prototypes/onboarding-screen.html`. Two steps.

- **Sign in** — Google / Apple only (no passwords/forms); brand moment + tagline.
- **Quiz** — short and **skippable** (skip top-right *and* bottom). Cuisines (multi) + diet (single) = soft recipe bias; **allergies** (multi) = input to the hard safety guard ("kept out of every recipe").

---

## Profile (tab)
**Designed:** `prototypes/profile-screen.html`. Minimal.

- User card (avatar, name, email + auth provider).
- **Cuisines & diet** and **Allergies** edited **inline via dropdowns** (tap a row to expand — no sub-screens).
- **Sign out** (quiet red).
- No terms/privacy clutter — just a version line.
