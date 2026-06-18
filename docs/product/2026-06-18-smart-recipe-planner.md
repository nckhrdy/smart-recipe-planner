# Product Brief: Smart Recipe Planner

**Status:** Agreed starting point (v1 north star) — iterates as we learn
**Date:** 2026-06-18
**Author:** Nick Hardy
**Mode:** New Feature

## Problem
A tired ~6pm home cook with no plan from the grocery run, staring at semi-random ingredients — or someone midweek who wants a change. Pains: decision fatigue ("what can I even make?"), the friction of typing ingredients into a search box, and food waste. A photo kills the typing; a short, structured list kills the doom-scroll.

## Target User
The "what can I even make?" home cook — tired, no plan, low patience for setup. 

## What we're building (functionality)
- **Sign in** with Google / Apple — no self-managed auth.
- **Onboarding quiz** (first launch): cuisines + dietary/allergy.
- **Accounts + DB**, kept as simple as possible (managed auth + a hosted DB for prefs and saved recipes).
- **Core flow:** camera (shoot *or* pick from camera roll) → **confirm / correct detected ingredients** → 5 structured recipes → **Refresh** for 5 new ones, no repeats across refreshes → tap into the full structured recipe.
- **My Recipes:** save recipes so they don't vanish on refresh.
- **Allergy guard:** deterministically check each generated recipe against the user's allergy list and regenerate/reject on a hit. Preferences are a soft bias; allergies are a hard check.

## Pages / navigation
First launch (once): **Sign in → Quiz**.

Bottom nav, left → right (camera centered):
- **🏠 Home** — a lean dashboard: a "start cooking" nudge and a few recently-saved recipes; points into the other tabs.
- **📋 Recipe List** — where the camera's latest 5 populate, with **Refresh**. Needs a sensible empty state before the first photo.
- **📷 Camera (center, prominent)** — the hero action: tap to shoot, with a camera-roll affordance beside it (Snapchat-style); runs capture → confirm → populates Recipe List.
- **📒 My Recipes** — saved keepers.
- **👤 Profile** — edit preferences & allergies, sign out (moved into the nav to balance the centered camera).

**Recipe detail** is a shared screen reached from Recipe List, My Recipes, and Home.

## Open — to decide next (architecture / design)
- AI model for vision (photo → ingredients) and structured recipe generation.
- How "no repeats across refreshes" is actually enforced.
- Managed backend choice (auth + DB) consistent with keeping it simple.
- Recipe-detail fields (ingredients with quantities, numbered steps, time, servings, have-vs-need).
- Onboarding-quiz specifics (which cuisines, how many steps).

## Out of scope (deferred)
- **Weekly Plan** — an app-generated multi-day plan. Cut 2026-06-18: too large for the take-home (drags in cross-session memory, plan generation, and most of the personalization). The core photo → recipes flow stands on its own; revisit post-submission.

## Process
Design-first: prototype the screens in HTML, discuss, then build in Expo. Technical decisions get recorded as ADRs via `/architect`.
