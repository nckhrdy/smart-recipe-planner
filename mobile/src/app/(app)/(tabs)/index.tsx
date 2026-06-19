/**
 * Home — the lean daily landing (screens.md): topbar wordmark, a time-aware
 * Fredoka greeting, one cobalt "snap to cook" hero (the screen's single orange
 * action), and a peek at recently-saved recipes that links into My Recipes.
 */
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RecipeCard } from '@/components/recipe-card';
import { StrawberryDoodle } from '@/components/ui/doodles';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Topbar } from '@/components/ui/topbar';
import { useIdentity } from '@/lib/identity';
import { useSaved } from '@/lib/saved';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

function timeOfDay(): { greeting: string; meal: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: 'Good morning', meal: 'breakfast' };
  if (hour < 17) return { greeting: 'Good afternoon', meal: 'lunch' };
  return { greeting: 'Good evening', meal: 'dinner' };
}

export default function HomeScreen() {
  const saved = useSaved((s) => s.recipes);
  const toggle = useSaved((s) => s.toggle);
  const { firstName, initial } = useIdentity();
  const { greeting, meal } = timeOfDay();
  const recent = saved.slice(0, 2);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Topbar initial={initial} />

        <View style={styles.hello}>
          <AppText variant="overline">{greeting}</AppText>
          <AppText variant="display" style={styles.greeting}>
            Let&apos;s sort {meal}, {firstName}.
          </AppText>
        </View>

        <View style={styles.snap}>
          <View style={styles.berry}>
            <StrawberryDoodle size={132} color={colors.white} opacity={0.16} />
          </View>
          <AppText style={styles.snapTitle}>What can you{'\n'}make tonight?</AppText>
          <AppText style={styles.snapBody}>Point at your fridge or counter — get 5 recipes in seconds.</AppText>
          <Pressable
            onPress={() => router.push('/camera')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.snapCta, pressed && styles.snapCtaPressed]}>
            <Feather name="camera" size={17} color={colors.white} />
            <AppText style={styles.snapCtaText}>Snap your ingredients</AppText>
          </Pressable>
        </View>

        <View style={styles.sectionHead}>
          <AppText style={styles.sectionLabel}>Recently saved</AppText>
          {saved.length > 0 ? (
            <Pressable onPress={() => router.push('/saved')} accessibilityRole="button" style={styles.seeAll}>
              <AppText style={styles.seeAllText}>See all</AppText>
              <Feather name="chevron-right" size={15} color={colors.blue} />
            </Pressable>
          ) : null}
        </View>

        {recent.length === 0 ? (
          <AppText variant="meta">Saved recipes show up here. Tap the bookmark on any recipe to keep it.</AppText>
        ) : (
          <View style={styles.cards}>
            {recent.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                variant="compact"
                saved
                onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
                onToggleSave={() => toggle(r)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(8) },
  hello: { paddingTop: space(3), paddingBottom: space(1) },
  greeting: { fontSize: 34, lineHeight: 36, marginTop: space(2) },

  snap: { backgroundColor: colors.blue, borderRadius: radius.sheet, padding: space(5), marginTop: space(5), overflow: 'hidden', ...shadow.fab },
  berry: { position: 'absolute', right: -10, bottom: -16 },
  snapTitle: { fontFamily: fonts.display.semibold, fontSize: 25, lineHeight: 27, color: colors.white },
  snapBody: { fontFamily: fonts.sans.medium, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.82)', marginTop: space(2), marginBottom: space(4), maxWidth: '82%' },
  snapCta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: space(2), backgroundColor: colors.orange, borderRadius: radius.md, paddingVertical: space(3), paddingHorizontal: space(4), ...shadow.cta },
  snapCtaPressed: { backgroundColor: colors.orangePress },
  snapCtaText: { fontFamily: fonts.sans.bold, fontSize: 14.5, color: colors.white },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space(7), marginBottom: space(3) },
  sectionLabel: { fontFamily: fonts.sans.extrabold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.ink },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontFamily: fonts.sans.bold, fontSize: 13, color: colors.blue },
  cards: { gap: space(3) },
});
