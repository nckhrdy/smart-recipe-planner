import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { colors, radius, space } from '@/theme/tokens';

export interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  /** Smaller footprint for inline use (e.g. an ingredient count chip). */
  compact?: boolean;
}

export function Stepper({ value, onChange, min = 1, max = 99, compact = false }: StepperProps) {
  const size = compact ? 24 : 36;
  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="decrease"
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.btn, { width: size, height: size }]}>
        <AppText variant={compact ? 'sectionHero' : 'title'} color={colors.blue}>
          −
        </AppText>
      </Pressable>
      <AppText variant={compact ? 'label' : 'sectionHero'} style={styles.value}>
        {value}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="increase"
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.btn, { width: size, height: size }]}>
        <AppText variant={compact ? 'sectionHero' : 'title'} color={colors.blue}>
          +
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  compactRow: { gap: space(2) },
  btn: { borderRadius: radius.full, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: space(6), textAlign: 'center' },
});
