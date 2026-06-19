/**
 * Onboarding quiz (first launch, step 2). Cuisines + diet (soft bias) and
 * allergies (the hard guard). Short and skippable (top-right and bottom). Reached
 * only when signed in but not yet onboarded — so it engages with real Google
 * auth; the dev bypass skips straight to the app. Matches the quiz prototype.
 */
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { SelectChips } from '@/components/ui/select-chips';
import { AppText } from '@/components/ui/text';
import { ALLERGENS, CUISINES, DIETS } from '@/lib/options';
import { usePrefs } from '@/lib/prefs';
import { saveProfile } from '@/lib/profile';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function OnboardingScreen() {
  const setPrefs = usePrefs((s) => s.setPrefs);
  const { completeOnboarding, session } = useSession();
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const finish = (save: boolean) => {
    if (save) {
      const prefs = { cuisines, diets: diet, allergies };
      setPrefs(prefs);
      const userId = session?.user?.id;
      if (userId) void saveProfile(userId, prefs).catch((err) => console.warn('Could not save profile', err));
    }
    void completeOnboarding();
  };

  return (
    <Screen padded={false}>
      <View style={styles.top}>
        <Pressable onPress={() => finish(false)} accessibilityRole="button" hitSlop={8}>
          <AppText style={styles.skip}>Skip</AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.heroTitle}>A few quick taps</AppText>
        <AppText variant="meta" style={styles.heroSub}>
          So your recipes feel like you. Totally optional — skip anytime.
        </AppText>

        <QuizSection title="Cuisines you love" sub="We'll lean this way when we can.">
          <SelectChips options={CUISINES} selected={cuisines} onToggle={(v) => setCuisines(toggleIn(cuisines, v))} />
        </QuizSection>

        <QuizSection title="Any diet?" sub="Pick one.">
          <SelectChips options={DIETS} selected={diet} onToggle={(v) => setDiet(diet.includes(v) ? [] : [v])} />
        </QuizSection>

        <QuizSection title="Allergies to keep out" sub="We'll keep these out of every recipe." emphasis>
          <SelectChips allergen options={ALLERGENS} selected={allergies} onToggle={(v) => setAllergies(toggleIn(allergies, v))} />
        </QuizSection>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => finish(true)} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} accessibilityRole="button">
          <AppText style={styles.ctaText}>Start cooking</AppText>
        </Pressable>
        <Pressable onPress={() => finish(false)} accessibilityRole="button" hitSlop={8}>
          <AppText style={styles.skipLink}>Skip for now</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

function QuizSection({ title, sub, emphasis, children }: { title: string; sub: string; emphasis?: boolean; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <AppText style={[styles.sectionSub, emphasis && styles.sectionSubEmphasis]}>{sub}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space(5), paddingTop: space(2) },
  skip: { fontFamily: fonts.sans.bold, fontSize: 13.5, color: colors.muted },
  scroll: { paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(6) },
  heroTitle: { fontFamily: fonts.display.semibold, fontSize: 30, lineHeight: 31, color: colors.blue },
  heroSub: { marginTop: space(2) },

  section: { marginTop: space(5) },
  sectionTitle: { fontFamily: fonts.sans.extrabold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.ink, marginBottom: space(1) },
  sectionSub: { fontFamily: fonts.sans.medium, fontSize: 12.5, color: colors.muted, marginBottom: space(3) },
  sectionSubEmphasis: { fontFamily: fonts.sans.bold, color: colors.blueDeep },

  footer: { paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(8) },
  cta: { backgroundColor: colors.orange, borderRadius: radius.lg, paddingVertical: space(4), alignItems: 'center', ...shadow.cta },
  ctaPressed: { backgroundColor: colors.orangePress },
  ctaText: { fontFamily: fonts.sans.bold, fontSize: 15.5, color: colors.white },
  skipLink: { textAlign: 'center', marginTop: space(3), fontFamily: fonts.sans.bold, fontSize: 13.5, color: colors.muted },
});
