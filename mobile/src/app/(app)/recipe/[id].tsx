/**
 * Recipe Detail (shared: Recipe List / My Recipes / Home). Custom header (back +
 * save), hero, prep/cook/total stat strip, a collapsible cook timer, the plain
 * ingredient list with a live servings stepper (quantities recompute, ADR-0003),
 * and the numbered method — matching the recipe-detail prototype.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CookTimer } from '@/components/ui/cook-timer';
import { PotDoodle } from '@/components/ui/doodles';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { Stepper } from '@/components/ui/stepper';
import { AppText } from '@/components/ui/text';
import { useRecipeSession } from '@/lib/recipe-session';
import { useSaved } from '@/lib/saved';
import type { Recipe, RecipeIngredient } from '@/lib/types';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

/** Live servings scaling (ADR-0003): name on the left, recomputed quantity on the right. */
function scaleParts(ing: RecipeIngredient, multiplier: number): { name: string; qty: string } {
  if (ing.amount === null) return { name: ing.name, qty: ing.note ?? 'to taste' };
  const scaled = Math.round(ing.amount * multiplier * 4) / 4; // nearest quarter
  const unit = ing.unit ? ` ${ing.unit}` : '';
  const note = ing.note ? `, ${ing.note}` : '';
  return { name: ing.name, qty: `${scaled}${unit}${note}` };
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
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/recipes'));

  if (!recipe) {
    return (
      <Screen>
        <Header saved={false} onBack={goBack} onToggleSave={() => {}} />
        <View style={styles.center}>
          <AppText variant="sectionHero">Recipe not found</AppText>
          <AppText variant="meta" style={styles.centerText}>
            It may have been refreshed away. Save the ones you like next time.
          </AppText>
        </View>
      </Screen>
    );
  }

  const saved = savedRecipes.some((r) => r.id === recipe.id);
  const multiplier = target / recipe.servings;
  const overline = recipe.tags.length ? recipe.tags.join(' · ') : recipe.dishType;

  return (
    <Screen padded={false}>
      <View style={styles.gutter}>
        <Header saved={saved} onBack={goBack} onToggleSave={() => toggle(recipe)} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText variant="overline" color={colors.blue}>
            {overline}
          </AppText>
          <AppText style={styles.title}>{recipe.title}</AppText>
          {recipe.hook ? (
            <AppText variant="body" style={styles.hook}>
              {recipe.hook}
            </AppText>
          ) : null}
        </View>

        <View style={styles.stats}>
          <Stat label="Prep" value={`${recipe.prepMinutes}m`} />
          <Stat label="Cook" value={`${recipe.cookMinutes}m`} />
          <Stat label="Total" value={`${recipe.totalMinutes}m`} accent last />
        </View>

        <View style={styles.block}>
          <CookTimer defaultMinutes={Math.min(60, Math.max(5, recipe.cookMinutes || 20))} />
        </View>

        <View style={[styles.block, styles.card]}>
          <View style={styles.cardHead}>
            <AppText style={styles.cardTitle}>Ingredients</AppText>
            <View style={styles.servWrap}>
              <AppText style={styles.servLabel}>Serves</AppText>
              <Stepper value={target} onChange={setTarget} />
            </View>
          </View>
          {recipe.ingredients.map((ing, i) => {
            const { name, qty } = scaleParts(ing, multiplier);
            return (
              <View key={i} style={[styles.ingRow, i === recipe.ingredients.length - 1 && styles.ingRowLast]}>
                <AppText style={styles.ingName}>{name}</AppText>
                <AppText style={styles.ingQty}>{qty}</AppText>
              </View>
            );
          })}
        </View>

        <View style={[styles.block, styles.card]}>
          <View style={styles.cardHead}>
            <AppText style={styles.cardTitle}>Method</AppText>
          </View>
          {recipe.steps.map((step, i) => (
            <View key={i} style={[styles.stepRow, i > 0 && styles.stepRowDivider]}>
              <View style={styles.stepNum}>
                <AppText style={styles.stepNumText}>{i + 1}</AppText>
              </View>
              <AppText style={styles.stepText}>{step}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.foot}>
          <PotDoodle size={58} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Header({ saved, onBack, onToggleSave }: { saved: boolean; onBack: () => void; onToggleSave: () => void }) {
  return (
    <View style={styles.header}>
      <IconButton onPress={onBack} accessibilityLabel="back">
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
      </IconButton>
      <IconButton onPress={onToggleSave} active={saved} accessibilityLabel={saved ? 'unsave' : 'save'}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.white : colors.blue} />
      </IconButton>
    </View>
  );
}

function Stat({ label, value, accent, last }: { label: string; value: string; accent?: boolean; last?: boolean }) {
  return (
    <View style={[styles.stat, !last && styles.statDivider]}>
      <AppText style={[styles.statValue, accent && styles.statAccent]}>{value}</AppText>
      <AppText style={styles.statKey}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: space(5) },
  scroll: { paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(10) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(2), paddingHorizontal: space(5) },
  centerText: { textAlign: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space(2), paddingBottom: space(1) },

  hero: { paddingTop: space(3) },
  title: { fontFamily: fonts.sans.extrabold, fontSize: 29, lineHeight: 32, letterSpacing: -0.4, color: colors.ink, marginTop: space(2) },
  hook: { color: colors.muted, marginTop: space(2) },

  stats: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, marginTop: space(4), overflow: 'hidden' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: space(3) },
  statDivider: { borderRightWidth: 1, borderRightColor: colors.line },
  statValue: { fontFamily: fonts.sans.extrabold, fontSize: 17, color: colors.ink },
  statAccent: { color: colors.blue },
  statKey: { fontFamily: fonts.sans.bold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted, marginTop: 3 },

  block: { marginTop: space(3) },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: space(4), ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space(2) },
  cardTitle: { fontFamily: fonts.sans.extrabold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.ink },
  servWrap: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  servLabel: { fontFamily: fonts.sans.bold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.muted },

  ingRow: { flexDirection: 'row', alignItems: 'baseline', gap: space(3), paddingVertical: space(2) + 2, borderBottomWidth: 1, borderBottomColor: colors.line },
  ingRowLast: { borderBottomWidth: 0 },
  ingName: { flex: 1, fontFamily: fonts.sans.semibold, fontSize: 14.5, color: colors.ink },
  ingQty: { fontFamily: fonts.sans.semibold, fontSize: 13, color: colors.muted, textAlign: 'right' },

  stepRow: { flexDirection: 'row', gap: space(3), paddingVertical: space(3) },
  stepRowDivider: { borderTopWidth: 1, borderTopColor: colors.line },
  stepNum: { width: 27, height: 27, borderRadius: radius.full, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontFamily: fonts.display.semibold, fontSize: 13, color: colors.blueDeep },
  stepText: { flex: 1, fontFamily: fonts.sans.medium, fontSize: 14, lineHeight: 21, color: colors.ink },

  foot: { alignItems: 'center', paddingTop: space(6) },
});
