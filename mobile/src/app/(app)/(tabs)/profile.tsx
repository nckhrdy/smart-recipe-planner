import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Section } from '@/components/ui/section';
import { SelectChips } from '@/components/ui/select-chips';
import { AppText } from '@/components/ui/text';
import { ALLERGENS, CUISINES, DIETS } from '@/lib/options';
import { usePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { colors, radius, shadow, space } from '@/theme/tokens';

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function ProfileScreen() {
  const { cuisines, diets, allergies, setPrefs } = usePrefs();
  const { signOut, configured } = useSession();

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <AppText variant="title" color={colors.white}>
              N
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="sectionHero">You</AppText>
            <AppText variant="meta" color={colors.muted}>
              Preferences are saved on this device.
            </AppText>
          </View>
        </View>

        <Section title="Cuisines" subtitle="A soft bias for your recipes">
          <SelectChips options={CUISINES} selected={cuisines} onToggle={(v) => setPrefs({ cuisines: toggleIn(cuisines, v) })} />
        </Section>

        <Section title="Diet">
          <SelectChips options={DIETS} selected={diets} onToggle={(v) => setPrefs({ diets: diets.includes(v) ? [] : [v] })} />
        </Section>

        <Section title="Allergies" subtitle="Kept out of every recipe — a hard check">
          <SelectChips options={ALLERGENS} selected={allergies} onToggle={(v) => setPrefs({ allergies: toggleIn(allergies, v) })} />
        </Section>

        {configured ? <Button label="Sign out" variant="ghost" onPress={() => void signOut()} style={styles.signOut} /> : null}
        <AppText variant="meta" color={colors.muted} style={styles.version}>
          Smart Recipe Planner · v1
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: space(8), gap: space(5) },
  flex: { flex: 1 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: space(3), backgroundColor: colors.surface, borderRadius: radius.card, padding: space(4), ...shadow.card },
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  signOut: { marginTop: space(2) },
  version: { textAlign: 'center', marginTop: space(2) },
});
