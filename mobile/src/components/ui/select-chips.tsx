import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { colors, radius, space } from '@/theme/tokens';

export interface SelectChipsProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** Tappable chip group for multi- or single-select (the caller's onToggle
 *  decides which). Selected = cobalt fill, unselected = cobalt tint. */
export function SelectChips({ options, selected, onToggle }: SelectChipsProps) {
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
            style={[styles.chip, on && styles.chipOn]}>
            <AppText variant="label" color={on ? colors.white : colors.blueDeep}>
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  chip: { backgroundColor: colors.blueSoft, borderRadius: radius.full, paddingVertical: space(2), paddingHorizontal: space(3) },
  chipOn: { backgroundColor: colors.blue },
});
