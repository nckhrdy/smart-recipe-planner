/**
 * RecipeCard — the signature surface, two layouts (matches the prototypes):
 *  - `full` (Recipe List): "01" index, title + hook, prep/cook/serves meta with
 *    cobalt line icons, an expandable ingredient-pill peek, and a footer with the
 *    expand toggle + a circular save button.
 *  - `compact` (Home, My Recipes): title + hook, a circular save button, and a
 *    single tag · time · serves row. No index, no expand.
 * Save = cobalt (outline when off, filled when on) — never orange (tokens §8).
 */
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import type { Recipe } from '@/lib/types';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

export interface RecipeCardProps {
  recipe: Recipe;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  variant?: 'full' | 'compact';
  /** "01"-style index on the full card (Recipe List). */
  index?: number;
}

function SaveButton({ saved, onPress }: { saved: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'unsave' : 'save'}
      style={[styles.save, saved && styles.saveOn]}>
      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? colors.white : colors.blue} />
    </Pressable>
  );
}

function MetaItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <AppText style={styles.metaText}>{label}</AppText>
    </View>
  );
}

export function RecipeCard({ recipe, saved, onPress, onToggleSave, variant = 'full', index }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const ingredientCount = recipe.ingredients.length;

  if (variant === 'compact') {
    const tag = recipe.tags[0];
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.compactTop}>
          <View style={styles.flex}>
            <AppText variant="recipeTitle">{recipe.title}</AppText>
            {recipe.hook ? (
              <AppText style={styles.hook} numberOfLines={1}>
                {recipe.hook}
              </AppText>
            ) : null}
          </View>
          <SaveButton saved={saved} onPress={onToggleSave} />
        </View>
        <View style={styles.compactRow}>
          {tag ? (
            <View style={styles.tag}>
              <AppText style={styles.tagText}>{tag}</AppText>
            </View>
          ) : null}
          <MetaItem icon={<Feather name="clock" size={14} color={colors.blue} />} label={`${recipe.totalMinutes} min`} />
          <View style={styles.dot} />
          <AppText style={styles.metaText}>Serves {recipe.servings}</AppText>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {index !== undefined ? <AppText style={styles.idx}>{String(index + 1).padStart(2, '0')}</AppText> : null}
      <AppText variant="recipeTitle" style={styles.fullTitle}>
        {recipe.title}
      </AppText>
      {recipe.hook ? <AppText style={styles.hook}>{recipe.hook}</AppText> : null}

      <View style={styles.metaRow}>
        <MetaItem icon={<Feather name="clock" size={15} color={colors.blue} />} label={`${recipe.prepMinutes}m prep`} />
        <MetaItem icon={<MaterialCommunityIcons name="pot-steam-outline" size={15} color={colors.blue} />} label={`${recipe.cookMinutes}m cook`} />
        <MetaItem icon={<Feather name="users" size={15} color={colors.blue} />} label={`Serves ${recipe.servings}`} />
      </View>

      {expanded ? (
        <View style={styles.pillRow}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.pill}>
              <AppText style={styles.pillText} numberOfLines={1}>
                {ing.name}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8} style={styles.expand} accessibilityRole="button">
          <AppText style={styles.expandText}>{expanded ? 'Hide ingredients' : `Ingredients (${ingredientCount})`}</AppText>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={colors.muted} />
        </Pressable>
        <SaveButton saved={saved} onPress={onToggleSave} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space(4),
    ...shadow.card,
  },
  pressed: { opacity: 0.92 },
  flex: { flex: 1 },

  // compact
  compactTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3) },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginTop: space(3), flexWrap: 'wrap' },

  // full
  idx: { position: 'absolute', top: space(4), right: space(4), fontFamily: fonts.display.semibold, fontSize: 12, color: colors.border },
  fullTitle: { marginRight: space(8) },

  hook: { fontFamily: fonts.sans.medium, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: space(1) },

  metaRow: { flexDirection: 'row', gap: space(4), marginTop: space(3), flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  metaText: { fontFamily: fonts.sans.semibold, fontSize: 12.5, color: colors.ink },

  tag: { backgroundColor: colors.blueSoft, borderRadius: radius.full, paddingHorizontal: space(3), paddingVertical: 3 },
  tagText: { fontFamily: fonts.sans.bold, fontSize: 11, color: colors.blueDeep },
  dot: { width: 3, height: 3, borderRadius: radius.full, backgroundColor: colors.muted },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(3) },
  pill: { backgroundColor: colors.blueSoft, borderRadius: radius.full, paddingHorizontal: space(3), paddingVertical: 5 },
  pillText: { fontFamily: fonts.sans.semibold, fontSize: 11.5, color: colors.blueDeep },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space(3),
    paddingTop: space(3),
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  expand: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  expandText: { fontFamily: fonts.sans.bold, fontSize: 12, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.ink },

  save: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOn: { backgroundColor: colors.blue, borderColor: colors.blue },
});
