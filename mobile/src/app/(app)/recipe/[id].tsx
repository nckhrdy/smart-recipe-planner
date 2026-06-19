import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Stepper } from '@/components/ui/stepper';
import { AppText } from '@/components/ui/text';
import { useRecipeSession } from '@/lib/recipe-session';
import { useSaved } from '@/lib/saved';
import type { Recipe, RecipeIngredient } from '@/lib/types';
import { colors, radius, space } from '@/theme/tokens';

/** Live servings scaling (ADR-0003). amount=null renders verbatim ("to taste"). */
function scaleLine(ing: RecipeIngredient, multiplier: number): string {
  if (ing.amount === null) {
    return ing.note ? `${ing.name} — ${ing.note}` : ing.name;
  }
  const scaled = Math.round(ing.amount * multiplier * 4) / 4; // nearest quarter
  const unit = ing.unit ? ` ${ing.unit}` : '';
  const note = ing.note ? `, ${ing.note}` : '';
  return `${scaled}${unit} ${ing.name}${note}`;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const findRecipe = useRecipeSession((s) => s.findRecipe);
  const savedRecipes = useSaved((s) => s.recipes);
  const toggle = useSaved((s) => s.toggle);

  const recipe: Recipe | undefined = useMemo(
    () => (id ? (findRecipe(id) ?? savedRecipes.find((r) => r.id === id)) : undefined),
    [id, findRecipe, savedRecipes],
  );
  const [target, setTarget] = useState(recipe?.servings ?? 2);

  if (!recipe) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText variant="sectionHero">Recipe not found</AppText>
          <AppText variant="meta" color={colors.muted}>
            It may have been refreshed away. Save the ones you like next time.
          </AppText>
        </View>
      </Screen>
    );
  }

  const saved = savedRecipes.some((r) => r.id === recipe.id);
  const multiplier = target / recipe.servings;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <AppText variant="h1" style={styles.flex}>
            {recipe.title}
          </AppText>
          <Pressable onPress={() => toggle(recipe)} hitSlop={10} accessibilityRole="button" accessibilityLabel={saved ? 'unsave' : 'save'}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={26} color={colors.blue} />
          </Pressable>
        </View>
        <AppText variant="body" color={colors.muted}>
          {recipe.hook}
        </AppText>

        <View style={styles.stats}>
          <Stat label="Prep" value={`${recipe.prepMinutes}m`} />
          <Stat label="Cook" value={`${recipe.cookMinutes}m`} />
          <Stat label="Total" value={`${recipe.totalMinutes}m`} />
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="sectionHero">Ingredients</AppText>
          <Stepper value={target} onChange={setTarget} />
        </View>
        <View style={styles.ingredients}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={styles.dot} />
              <AppText variant="body" style={styles.flex}>
                {scaleLine(ing, multiplier)}
              </AppText>
            </View>
          ))}
        </View>

        <AppText variant="sectionHero" style={styles.methodHeader}>
          Method
        </AppText>
        <View style={styles.steps}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <AppText variant="label" color={colors.white}>
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="body" style={styles.flex}>
                {step}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="overline">{label}</AppText>
      <AppText variant="sectionHero" color={colors.blue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(10), gap: space(3) },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(2) },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3) },
  stats: { flexDirection: 'row', gap: space(3), backgroundColor: colors.surface, borderRadius: radius.xl, padding: space(4), marginTop: space(2) },
  stat: { flex: 1, alignItems: 'center', gap: space(1) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space(4) },
  ingredients: { gap: space(2) },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3) },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.blue, marginTop: 9 },
  methodHeader: { marginTop: space(4) },
  steps: { gap: space(4) },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3) },
  stepNum: { width: 26, height: 26, borderRadius: radius.full, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
