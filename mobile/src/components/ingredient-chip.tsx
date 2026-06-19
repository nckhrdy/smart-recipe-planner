/**
 * IngredientChip — a detected ingredient on the Confirm screen: a cobalt-tint
 * pill with the name, an optional count stepper (countable items only), and a
 * remove button. Matches the prototype's `.ichip`.
 */
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Stepper } from '@/components/ui/stepper';
import { AppText } from '@/components/ui/text';
import { colors, fonts, radius, space } from '@/theme/tokens';

export interface IngredientChipProps {
  name: string;
  count: number | null;
  onRemove: () => void;
  onCountChange?: (next: number) => void;
}

export function IngredientChip({ name, count, onRemove, onCountChange }: IngredientChipProps) {
  return (
    <View style={styles.chip}>
      <AppText style={styles.name} numberOfLines={1}>
        {name}
      </AppText>
      {count !== null && onCountChange ? <Stepper value={count} onChange={onCountChange} compact /> : null}
      <Pressable onPress={onRemove} hitSlop={8} style={styles.remove} accessibilityRole="button" accessibilityLabel={`remove ${name}`}>
        <Feather name="x" size={12} color={colors.blueDeep} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: colors.blueSoft,
    borderRadius: radius.full,
    paddingVertical: space(2),
    paddingLeft: space(3) + 1,
    paddingRight: space(2),
  },
  name: { fontFamily: fonts.sans.semibold, fontSize: 13.5, color: colors.blueDeep, maxWidth: 170, textTransform: 'capitalize' },
  remove: { width: 18, height: 18, borderRadius: radius.full, backgroundColor: 'rgba(43,48,158,0.16)', alignItems: 'center', justifyContent: 'center' },
});
