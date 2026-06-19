/**
 * Onboarding quiz (first launch, step 2). Cuisines + diet (soft bias) and
 * allergies (the hard guard). Skippable. Reached only when signed in but not yet
 * onboarded — so it engages with real Google auth; the dev bypass skips straight
 * to the app (set prefs from the Profile tab there).
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SelectChips } from '@/components/ui/select-chips';
import { AppText } from '@/components/ui/text';
import { ALLERGENS, CUISINES, DIETS } from '@/lib/options';
import { usePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { colors, space } from '@/theme/tokens';

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function OnboardingScreen() {
  const setPrefs = usePrefs((s) => s.setPrefs);
  const { completeOnboarding } = useSession();
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const finish = (save: boolean) => {
    if (save) setPrefs({ cuisines, diets: diet, allergies });
    void completeOnboarding();
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <AppText variant="overline">A few quick taps</AppText>
          <Pressable onPress={() => finish(false)} accessibilityRole="button">
            <AppText variant="meta" color={colors.muted}>
              Skip
            </AppText>
          </Pressable>
        </View>
        <AppText variant="display">Make it yours.</AppText>
        <AppText variant="body" color={colors.muted}>
          Bias your recipes — and keep allergens out for good.
        </AppText>

        <Section title="Favorite cuisines">
          <SelectChips options={CUISINES} selected={cuisines} onToggle={(v) => setCuisines(toggleIn(cuisines, v))} />
        </Section>
        <Section title="Diet">
          <SelectChips options={DIETS} selected={diet} onToggle={(v) => setDiet(diet.includes(v) ? [] : [v])} />
        </Section>
        <Section title="Allergies" subtitle="Kept out of every recipe">
          <SelectChips options={ALLERGENS} selected={allergies} onToggle={(v) => setAllergies(toggleIn(allergies, v))} />
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Get started" variant="cta" onPress={() => finish(true)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(6), paddingBottom: space(8), gap: space(4) },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: { padding: space(5), paddingBottom: space(8) },
});
