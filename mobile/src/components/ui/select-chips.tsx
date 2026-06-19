/**
 * SelectChips — tappable chip group for multi- or single-select (the caller's
 * onToggle decides which). Bordered pill, cobalt fill when selected; allergens
 * fill blue-deep so the "hard guard" set reads distinctly (tokens §8, never
 * colour alone — the chip also reads as filled). Matches profile/onboarding.
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { colors, fonts, radius, space } from '@/theme/tokens';

export interface SelectChipsProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Allergens fill blue-deep when on (the hard safety set). */
  allergen?: boolean;
}

export function SelectChips({ options, selected, onToggle, allergen = false }: SelectChipsProps) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const on = selected.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => onToggle(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, on && styles.chipOn, on && allergen && styles.chipAllergen]}>
            <AppText style={[styles.text, on && styles.textOn]}>{option}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  chip: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.full, paddingVertical: space(2) + 1, paddingHorizontal: space(4) - 1 },
  chipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  chipAllergen: { backgroundColor: colors.blueDeep, borderColor: colors.blueDeep },
  text: { fontFamily: fonts.sans.semibold, fontSize: 13.5, color: colors.ink },
  textOn: { color: colors.white },
});
