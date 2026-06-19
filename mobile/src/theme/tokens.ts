/**
 * Design tokens — the in-code source of truth, mirrored from
 * `.claude/design-tokens.md`. If a value changes, change it in that markdown
 * first, then here. React Native has no CSS-variable layer, so this typed
 * object is how screens consume the system.
 *
 * Discipline (see design-tokens.md §8): cobalt carries the brand; body text is
 * `ink`, never cobalt; orange appears once per screen on the primary action.
 */
import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  // Brand
  blue: '#3A41D6', // cobalt — headings, icons, active nav, save-on
  blueDeep: '#2B309E', // pressed/active
  blueSoft: '#E7E8FB', // chips, pills, selected backgrounds
  // Neutrals & surfaces
  background: '#F0E9DA', // app canvas (warm off-white)
  surface: '#FFFCF6', // cards, sheets, nav bar
  ink: '#22203B', // primary text — the DEFAULT text color
  muted: '#8A8475', // secondary text, hints, meta
  border: '#ECE4D3', // borders on background
  line: '#F0EBE0', // hairline dividers inside cards
  // Accent — sparingly, one per screen
  orange: '#E5531B', // single primary action (Refresh, camera-roll nub)
  orangePress: '#C74614', // pressed
  // Destructive — sign-out only (quiet, never competes with the orange CTA)
  danger: '#C0392B',
  dangerSoft: '#F7E4E1',
  white: '#FFFFFF',
} as const;

/** Loaded font family names (see theme/fonts.ts). Display = Fredoka, sans = Hanken Grotesk. */
export const fonts = {
  display: {
    regular: 'Fredoka_400Regular',
    medium: 'Fredoka_500Medium',
    semibold: 'Fredoka_600SemiBold',
    bold: 'Fredoka_700Bold',
  },
  sans: {
    regular: 'HankenGrotesk_400Regular',
    medium: 'HankenGrotesk_500Medium',
    semibold: 'HankenGrotesk_600SemiBold',
    bold: 'HankenGrotesk_700Bold',
    extrabold: 'HankenGrotesk_800ExtraBold',
  },
} as const;

/** 4px grid. `space(5)` = 20 (the screen gutter). */
export const space = (n: number): number => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 22, // signature recipe-card roundness
  sheet: 28,
  full: 9999,
} as const;

/** Type scale (px) — size + line-height pairs from design-tokens.md §2. */
export const fontSize = {
  display: 40,
  h1: 34,
  h2: 28,
  h3: 22,
  recipeTitle: 19,
  body: 16,
  base: 15,
  sm: 13,
  xs: 12,
  overline: 11,
  micro: 10,
} as const;

export const lineHeight = {
  display: 38,
  h1: 34,
  h2: 29,
  h3: 24,
  recipeTitle: 22,
  body: 22,
  base: 22,
  sm: 18,
  xs: 16,
  overline: 13,
  micro: 12,
} as const;

/** One elevation per element — never stack border + shadow. */
export const shadow: Record<'card' | 'cta' | 'fab', ViewStyle> = {
  card: Platform.select({
    ios: { shadowColor: '#282350', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle,
  cta: Platform.select({
    ios: { shadowColor: colors.orange, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
  fab: Platform.select({
    ios: { shadowColor: colors.blue, shadowOpacity: 0.42, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 10 },
    default: {},
  }) as ViewStyle,
};
