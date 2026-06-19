/**
 * AppText — the single text primitive. Variants encode the type scale + family
 * + default color so screens never hand-pick a font string. Override color
 * sparingly; the variant's default already follows the WCAG/altitude rules
 * (body = ink, display/headings = cobalt).
 */
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts, fontSize, lineHeight } from '@/theme/tokens';

const styles = StyleSheet.create({
  display: {
    fontFamily: fonts.display.semibold,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    letterSpacing: -0.5,
    color: colors.blue,
  },
  h1: { fontFamily: fonts.sans.extrabold, fontSize: fontSize.h1, lineHeight: lineHeight.h1, color: colors.ink },
  title: { fontFamily: fonts.sans.extrabold, fontSize: fontSize.h2, lineHeight: lineHeight.h2, color: colors.ink },
  sectionHero: { fontFamily: fonts.sans.bold, fontSize: fontSize.h3, lineHeight: lineHeight.h3, color: colors.ink },
  recipeTitle: {
    fontFamily: fonts.sans.extrabold,
    fontSize: fontSize.recipeTitle,
    lineHeight: lineHeight.recipeTitle,
    color: colors.ink,
  },
  body: { fontFamily: fonts.sans.regular, fontSize: fontSize.body, lineHeight: lineHeight.body, color: colors.ink },
  bodyMedium: { fontFamily: fonts.sans.medium, fontSize: fontSize.body, lineHeight: lineHeight.body, color: colors.ink },
  meta: { fontFamily: fonts.sans.medium, fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.muted },
  label: { fontFamily: fonts.sans.semibold, fontSize: fontSize.xs, lineHeight: lineHeight.xs, color: colors.ink },
  overline: {
    fontFamily: fonts.sans.semibold,
    fontSize: fontSize.overline,
    lineHeight: lineHeight.overline,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  button: { fontFamily: fonts.sans.bold, fontSize: fontSize.body, lineHeight: lineHeight.body, color: colors.white },
});

export type TextVariant = keyof typeof styles;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  /** Override the variant's default color. Use only with a token from `colors`. */
  color?: string;
}

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const override: TextStyle | null = color ? { color } : null;
  return <Text {...rest} style={[styles[variant], override, style]} />;
}
