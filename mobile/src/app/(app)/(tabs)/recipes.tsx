import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { RecipeCard } from '@/components/recipe-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useRecipeSession } from '@/lib/recipe-session';
import { useSaved } from '@/lib/saved';
import { colors, space } from '@/theme/tokens';

export default function RecipeListScreen() {
  const recipes = useRecipeSession((s) => s.recipes);
  const generating = useRecipeSession((s) => s.generating);
  const exhausted = useRecipeSession((s) => s.exhausted);
  const hasGenerated = useRecipeSession((s) => s.hasGenerated);
  const refresh = useRecipeSession((s) => s.refresh);
  const savedRecipes = useSaved((s) => s.recipes);
  const toggle = useSaved((s) => s.toggle);
  const savedIds = useMemo(() => new Set(savedRecipes.map((r) => r.id)), [savedRecipes]);

  // First generate, nothing on screen yet → full loading state.
  if (generating && recipes.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.blue} size="large" />
          <AppText variant="sectionHero" style={styles.centerText}>
            Cooking up five ideas…
          </AppText>
          <AppText variant="meta" color={colors.muted} style={styles.centerText}>
            Reading your ingredients and plating options.
          </AppText>
        </View>
      </Screen>
    );
  }

  // Empty state, before the first photo.
  if (!hasGenerated && recipes.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <Feather name="camera" size={40} color={colors.blue} />
          <AppText variant="display" style={styles.centerText}>
            Nothing here yet
          </AppText>
          <AppText variant="body" color={colors.muted} style={styles.centerText}>
            Snap your ingredients from the camera tab and your five recipes land here.
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="overline">Tonight&apos;s options</AppText>
        <AppText variant="h1" style={styles.title}>
          Your five
        </AppText>

        {recipes.map((r, i) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            index={i}
            saved={savedIds.has(r.id)}
            onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
            onToggleSave={() => toggle(r)}
          />
        ))}

        {exhausted ? (
          <AppText variant="meta" color={colors.muted} style={styles.exhaust}>
            You&apos;ve explored these — add an ingredient or start a new photo for more.
          </AppText>
        ) : null}

        <Button
          label={generating ? 'Refreshing…' : 'Refresh — 5 new'}
          onPress={refresh}
          loading={generating}
          variant="cta"
          style={styles.refresh}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(8), gap: space(3) },
  title: { marginBottom: space(2) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(3) },
  centerText: { textAlign: 'center' },
  exhaust: { textAlign: 'center', paddingHorizontal: space(4) },
  refresh: { marginTop: space(2) },
});
