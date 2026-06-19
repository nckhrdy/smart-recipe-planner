# design-tokens.md

**Source of truth** for the Smart Recipe Planner visual language. Every screen and the eventual Expo `client/src/theme.ts` derives from this file. If a value isn't here, it doesn't exist — add it here first, then use it.

**The test:** *If you removed the strawberry pattern and the wordmark, would this still feel like a warm, playful home-cooking app — or like a generic recipe template?* Cobalt-on-cream + the rounded display + the one-orange-action discipline are what carry the identity. Hold that.

Reference: [product brief](../docs/product/2026-06-18-smart-recipe-planner.md) · [screen specs](../docs/design/screens.md) · brand backdrop asset: `prototypes/assets/recipe-background.svg`

---

## 1 · Color

### Brand
| Token | Hex | Use |
|---|---|---|
| `blue` | `#3A41D6` | Cobalt. The brand. Headings, icons, active nav, save-on, large/bold text, the strawberry pattern. |
| `blue-deep` | `#2B309E` | Pressed/active states, text on light-blue tints. |
| `blue-soft` | `#E7E8FB` | Tint for chips, ingredient pills, selected backgrounds. |

### Neutrals & surfaces
| Token | Hex | Use |
|---|---|---|
| `background` | `#F0E9DA` | App canvas (warm off-white). The strawberry backdrop sits on this. |
| `surface` | `#FFFCF6` | Cards, sheets, nav bar — opaque, sits above the pattern. |
| `ink` | `#22203B` | Primary body & functional text. **Default text color** (not cobalt). |
| `muted` | `#8A8475` | Secondary text, hints, hooks, meta labels. |
| `border` | `#ECE4D3` | Card/control borders on `background`. |
| `line` | `#F0EBE0` | Hairline dividers inside cards. |

### Accent — use sparingly
| Token | Hex | Use |
|---|---|---|
| `orange` | `#E5531B` | The single primary action per screen (Refresh, camera-roll nub). Never decorative. |
| `orange-press` | `#C7461480` | Pressed state (≈ darken 12%). |
| `danger` | `#C0392B` | Destructive only (sign-out). Quiet — never competes with the orange CTA. |
| `danger-soft` | `#F7E4E1` | Tint behind the sign-out icon. |

### Semantic roles
| Role | Token |
|---|---|
| primary / brand | `blue` |
| primary action (CTA) | `orange` |
| save / favorite (active) | `blue` |
| text | `ink` |
| text-secondary | `muted` |
| app background | `background` |
| elevated surface | `surface` |

> **Dark mode:** out of scope for v1 (keep it simple). When added, derive a parallel table here first — do not hardcode dark values in components.

### Backdrop pattern
The strawberry doodle backdrop (`recipe-background.svg`, 414×896) is **cobalt `#3A41D6` masked to a low opacity** on `background`. It is a texture, not content: always behind opaque surfaces, never under long-form body text.

---

## 2 · Typography

### Families
| Token | Font | Role |
|---|---|---|
| `font-display` | **Fredoka** (500/600/700) | Rounded, playful. Brand wordmark + hero moments only. Used sparingly for impact. |
| `font-sans` | **Hanken Grotesk** (400–800) | All functional UI, recipe titles, body. The workhorse. |
| `font-mono` | system mono | Rare — quantities/timer digits if a tabular feel is wanted. |

*(No serif in v1 — the rounded-display + grotesk pairing is the system. Revisit only if an editorial screen needs it.)*

### Scale (px)
| Token | Size | Line | Typical use |
|---|---|---|---|
| `display` | 40 | 0.96 | Fredoka hero ("Tonight's five.") |
| `3xl` | 34 | 1.0 | Big empty-state / onboarding headers |
| `2xl` | 28 | 1.05 | Screen titles |
| `xl` | 22 | 1.1 | Section heroes |
| `lg` | 19 | 1.15 | Recipe titles (sans 800) |
| `md` | 16 | 1.4 | Body |
| `base` | 15 | 1.45 | Default body |
| `sm` | 13 | 1.4 | Hooks, meta, secondary |
| `xs` | 12 | 1.3 | Labels, chips |
| `overline` | 11 | 1.2 | Uppercase eyebrows (`+0.16em`) |
| `micro` | 10 | 1.2 | Nav labels (`+0.02em`) |

### Weights
`regular 400` (body) · `medium 500` (secondary) · `semibold 600` (labels, meta, display) · `bold 700` (buttons, emphasis) · `extrabold 800` (recipe & screen titles).

### Type rules
- **Body text is `ink`, never cobalt.** Cobalt is reserved for headings, large/bold text (≥18px or 600+), icons, and accents — this keeps small text at WCAG AA on `background`/`surface`.
- Display (Fredoka) tracks tight (`-0.5px`); overlines/labels track loose and uppercase.
- One display moment per screen — don't stack Fredoka headers.

---

## 3 · Spacing — 4px grid
`1=4 · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 7=28 · 8=32 · 10=40 · 12=48 · 16=64`

- **Screen gutter:** `space-5` (20).
- **Card padding:** `space-4`–`space-5` (16–20).
- **Stack gap between cards:** `space-3`–`space-4` (12–16).

---

## 4 · Radius
| Token | px | Use |
|---|---|---|
| `sm` | 8 | Small chips, thumbnails |
| `md` | 12 | Inputs, small controls |
| `lg` | 16 | Inner card elements |
| `xl` | 20 | Context strips |
| `card` | 22 | Recipe cards (signature roundness) |
| `sheet` | 28 | Bottom sheets / modals |
| `full` | 9999 | Pills, chips, save circle, FAB |

Generous, friendly radii are part of the identity — nothing sharp/clinical.

---

## 5 · Elevation (shadows)
| Token | Value |
|---|---|
| `sm` | `0 2px 8px rgba(40,35,80,0.05)` |
| `md` | `0 6px 18px rgba(40,35,80,0.06)` — default card |
| `lg` | `0 14px 34px rgba(40,35,80,0.10)` — sheets |
| `cta` | `0 4px 12px rgba(229,83,27,0.28)` — orange buttons |
| `fab` | `0 10px 24px rgba(58,65,214,0.42)` — camera FAB |

Use **one** elevation per element — never stack border + shadow + glow.

---

## 6 · Motion
**Durations:** `fast 120ms` · `normal 180ms` · `slow 280ms` · `xslow 420ms`
**Easings:** `standard cubic-bezier(0.2,0.8,0.2,1)` · `enter cubic-bezier(0.16,1,0.3,1)` · `exit cubic-bezier(0.7,0,0.84,0)`

Refresh and card transitions use `normal`/`enter`. Keep motion confident and quick — this is a tired-cook utility, not a toy.

---

## 7 · Iconography & illustration
- **Icons:** single-weight line icons, `stroke-width: 2`, `round` caps/joins, drawn in `blue` (or `muted` when inactive). 22–24px in nav, 14–15px inline.
- **Doodles:** single-line cobalt illustrations (pot, strawberry, etc.) as a delight layer in empty/hero states. Match the strawberry backdrop's hand-drawn weight.
- **No emoji in UI.** Ever. Doodles and line icons do that job.

---

## 8 · Usage discipline (anti-slop)
- **Orange appears once per screen** — on the primary action only. If two things are orange, one is wrong.
- **Cobalt carries the brand; everything else is neutral.** Resist tinting every surface blue.
- **Save = cobalt (secondary), CTA = orange (primary).** Don't swap.
- **Never rely on color alone** — pair with icon/label (e.g. saved state = filled bookmark *and* cobalt).
- **WCAG AA** for all text. Small text on `ink`, not cobalt.
- The strawberry backdrop stays subtle and behind content; cards are opaque.

---

## 9 · Implementation
This markdown is the source of truth. It is mirrored into code as a typed token object at `client/src/theme.ts` (React Native has no CSS-variable layer), and the backdrop ships as an asset. When a value changes, change it **here first**, then in `theme.ts`. The HTML in `prototypes/` is the visual reference these tokens were derived from.
