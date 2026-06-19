/**
 * Stepper — − value + control. Default is the bordered pill used for "Serves" /
 * "Cooking for" (recipe detail, confirm). `compact` is the small blue-soft
 * variant for inline use (an ingredient-count chip).
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { colors, fonts, radius, space } from '@/theme/tokens';

export interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}

export function Stepper({ value, onChange, min = 1, max = 99, compact = false }: StepperProps) {
  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="decrease" onPress={() => onChange(Math.max(min, value - 1))} style={styles.compactBtn}>
          <AppText variant="sectionHero" color={colors.blue}>−</AppText>
        </Pressable>
        <AppText variant="label" style={styles.compactValue}>{value}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="increase" onPress={() => onChange(Math.min(max, value + 1))} style={styles.compactBtn}>
          <AppText variant="sectionHero" color={colors.blue}>+</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pill}>
      <Pressable accessibilityRole="button" accessibilityLabel="decrease" onPress={() => onChange(Math.max(min, value - 1))} style={styles.btn}>
        <AppText style={styles.sign}>−</AppText>
      </Pressable>
      <AppText style={styles.value}>{value}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="increase" onPress={() => onChange(Math.min(max, value + 1))} style={styles.btn}>
        <AppText style={styles.sign}>+</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.full },
  btn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  sign: { fontFamily: fonts.sans.bold, fontSize: 18, color: colors.blue, marginTop: -2 },
  value: { minWidth: 28, textAlign: 'center', fontFamily: fonts.sans.extrabold, fontSize: 15, color: colors.ink },

  compactRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  compactBtn: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  compactValue: { minWidth: space(5), textAlign: 'center' },
});
