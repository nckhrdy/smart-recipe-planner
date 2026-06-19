import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Stepper } from '@/components/ui/stepper';
import { AppText } from '@/components/ui/text';
import { colors, radius, space } from '@/theme/tokens';

export interface IngredientChipProps {
  name: string;
  count: number | null;
  onRemove: () => void;
  onCountChange?: (next: number) => void;
}

export function IngredientChip({ name, count, onRemove, onCountChange }: IngredientChipProps) {
  return (
    <View style={styles.chip}>
      <AppText variant="label" numberOfLines={1} style={styles.name}>
        {name}
      </AppText>
      {count !== null && onCountChange ? <Stepper value={count} onChange={onCountChange} compact /> : null}
      <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`remove ${name}`}>
        <Ionicons name="close-circle" size={18} color={colors.muted} />
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
    paddingHorizontal: space(3),
  },
  name: { color: colors.blueDeep, maxWidth: 160 },
});
