import { Feather, Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import type { Recipe } from '@/lib/types';
import { colors, radius, shadow, space } from '@/theme/tokens';

export interface RecipeCardProps {
  recipe: Recipe;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  /** Show a "01"-style index (Recipe List); omit in My Recipes. */
  index?: number;
}

export function RecipeCard({ recipe, saved, onPress, onToggleSave, index }: RecipeCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        {index !== undefined ? <AppText variant="overline">{String(index + 1).padStart(2, '0')}</AppText> : <View />}
        <Pressable onPress={onToggleSave} hitSlop={10} accessibilityRole="button" accessibilityLabel={saved ? 'unsave' : 'save'}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.blue} />
        </Pressable>
      </View>

      <AppText variant="recipeTitle">{recipe.title}</AppText>
      <AppText variant="meta" numberOfLines={1}>
        {recipe.hook}
      </AppText>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={13} color={colors.muted} />
          <AppText variant="meta">{recipe.totalMinutes} min</AppText>
        </View>
        <View style={styles.metaItem}>
          <Feather name="users" size={13} color={colors.muted} />
          <AppText variant="meta">Serves {recipe.servings}</AppText>
        </View>
        {recipe.tags[0] ? (
          <View style={styles.tag}>
            <AppText variant="label" color={colors.blueDeep}>
              {recipe.tags[0]}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space(5),
    gap: space(2),
    ...shadow.card,
  },
  pressed: { opacity: 0.9 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space(4), marginTop: space(2), flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  tag: { backgroundColor: colors.blueSoft, borderRadius: radius.full, paddingHorizontal: space(3), paddingVertical: space(1) },
});
