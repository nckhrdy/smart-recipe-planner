import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { RecipeCard } from '@/components/recipe-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useSaved } from '@/lib/saved';
import { colors, radius, shadow, space } from '@/theme/tokens';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const saved = useSaved((s) => s.recipes);
  const toggle = useSaved((s) => s.toggle);
  const recent = saved.slice(0, 2);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="overline">{greeting()}</AppText>
        <AppText variant="display">What can you make tonight?</AppText>

        <View style={styles.hero}>
          <View style={styles.heroText}>
            <AppText variant="sectionHero" color={colors.white}>
              Start with a photo
            </AppText>
            <AppText variant="meta" color={colors.blueSoft}>
              Snap your fridge — five recipes in seconds.
            </AppText>
          </View>
          <Feather name="camera" size={38} color={colors.white} />
        </View>
        <Button label="Snap your ingredients" variant="cta" onPress={() => router.push('/camera')} />

        <View style={styles.sectionHead}>
          <AppText variant="sectionHero">Recently saved</AppText>
          {saved.length > 0 ? (
            <Pressable onPress={() => router.push('/saved')} accessibilityRole="button">
              <AppText variant="meta" color={colors.blue}>
                See all →
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {recent.length === 0 ? (
          <AppText variant="meta" color={colors.muted}>
            Saved recipes show up here. Tap the bookmark on any recipe to keep it.
          </AppText>
        ) : (
          recent.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              saved
              onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
              onToggleSave={() => toggle(r)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: space(8), gap: space(3) },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    backgroundColor: colors.blue,
    borderRadius: radius.card,
    padding: space(5),
    marginTop: space(2),
    ...shadow.fab,
  },
  heroText: { flex: 1, gap: space(1) },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space(4) },
});
