/**
 * My Recipes — the saved keepers (screens.md). Fredoka header + live count,
 * search, quick filter chips, and the compact recipe card (bookmark filled).
 * Un-save via the bookmark; a doodle empty state when the bucket is clear.
 */
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { RecipeCard } from '@/components/recipe-card';
import { BookmarkDoodle } from '@/components/ui/doodles';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { isVegetarian } from '@/lib/diet';
import { useSaved } from '@/lib/saved';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

const FILTERS = ['All', 'Vegetarian', 'Under 30 min', 'Breakfast'] as const;
type Filter = (typeof FILTERS)[number];

export default function SavedScreen() {
  const saved = useSaved((s) => s.recipes);
  const toggle = useSaved((s) => s.toggle);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return saved.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q) && !r.ingredients.some((i) => i.name.includes(q))) return false;
      if (filter === 'Vegetarian') return isVegetarian(r);
      if (filter === 'Under 30 min') return r.totalMinutes <= 30;
      if (filter === 'Breakfast') return /breakfast/i.test(r.dishType) || r.tags.some((t) => /breakfast/i.test(t));
      return true;
    });
  }, [saved, query, filter]);

  if (saved.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <BookmarkDoodle size={76} />
          <AppText variant="display" style={[styles.center, styles.emptyTitle]}>
            No saved recipes yet
          </AppText>
          <AppText variant="body" style={styles.center}>
            Tap the bookmark on any recipe to keep it here for later.
          </AppText>
          <Pressable onPress={() => router.push('/camera')} style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]} accessibilityRole="button">
            <Feather name="camera" size={17} color={colors.white} />
            <AppText style={styles.emptyCtaText}>Find a recipe</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.gutter}>
          <AppText variant="overline" color={colors.blue}>
            Saved
          </AppText>
          <AppText style={styles.title}>My Recipes</AppText>
          <AppText variant="meta" style={styles.count}>
            {saved.length} recipe{saved.length === 1 ? '' : 's'} kept
          </AppText>

          <View style={styles.search}>
            <Feather name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your recipes"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => {
            const on = f === filter;
            return (
              <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterChip, on && styles.filterChipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <AppText style={[styles.filterText, on && styles.filterTextOn]}>{f}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.cards}>
          {filtered.length === 0 ? (
            <AppText variant="meta" style={styles.center}>
              Nothing matches that filter.
            </AppText>
          ) : (
            filtered.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                variant="compact"
                saved
                onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: r.id } })}
                onToggleSave={() => toggle(r)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: space(2), paddingBottom: space(8) },
  gutter: { paddingHorizontal: space(5) },
  center: { textAlign: 'center' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(3), paddingHorizontal: space(8) },
  emptyTitle: { marginTop: space(2), fontSize: 26, lineHeight: 30 },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: space(2), backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: space(3), paddingHorizontal: space(5), marginTop: space(2), ...shadow.fab },
  emptyCtaPressed: { backgroundColor: colors.blueDeep },
  emptyCtaText: { fontFamily: fonts.sans.bold, fontSize: 14.5, color: colors.white },

  title: { fontFamily: fonts.display.semibold, fontSize: 33, lineHeight: 34, color: colors.blue, marginTop: space(1) },
  count: { marginTop: space(2) },

  search: { flexDirection: 'row', alignItems: 'center', gap: space(2), backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: space(4), paddingVertical: space(3), marginTop: space(4) },
  searchInput: { flex: 1, fontFamily: fonts.sans.medium, fontSize: 15, color: colors.ink, padding: 0 },

  filters: { flexDirection: 'row', gap: space(2), paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: space(1) },
  filterChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.full, paddingVertical: space(2), paddingHorizontal: space(4) },
  filterChipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  filterText: { fontFamily: fonts.sans.bold, fontSize: 13, color: colors.ink },
  filterTextOn: { color: colors.white },

  cards: { paddingHorizontal: space(5), paddingTop: space(3), gap: space(3) },
});
