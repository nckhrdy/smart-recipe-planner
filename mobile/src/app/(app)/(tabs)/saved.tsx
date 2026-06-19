import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { RecipeCard } from '@/components/recipe-card';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { useSaved } from '@/lib/saved';
import { colors, fonts, radius, space } from '@/theme/tokens';

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
      if (filter === 'Vegetarian') return r.tags.some((t) => /vegetarian|vegan/i.test(t));
      if (filter === 'Under 30 min') return r.totalMinutes <= 30;
      if (filter === 'Breakfast') return /breakfast/i.test(r.dishType) || r.tags.some((t) => /breakfast/i.test(t));
      return true;
    });
  }, [saved, query, filter]);

  if (saved.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Feather name="bookmark" size={40} color={colors.blue} />
          <AppText variant="display" style={styles.center}>
            No saved recipes yet
          </AppText>
          <AppText variant="body" color={colors.muted} style={styles.center}>
            Tap the bookmark on any recipe and it&apos;ll live here.
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="overline">My Recipes</AppText>
        <AppText variant="display">
          {saved.length} saved
        </AppText>

        <View style={styles.search}>
          <Feather name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search saved recipes"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const on = f === filter;
            return (
              <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterChip, on && styles.filterChipOn]}>
                <AppText variant="label" color={on ? colors.white : colors.muted}>
                  {f}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {filtered.length === 0 ? (
          <AppText variant="meta" color={colors.muted} style={styles.center}>
            Nothing matches that filter.
          </AppText>
        ) : (
          filtered.map((r) => (
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(3) },
  center: { textAlign: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    marginTop: space(2),
  },
  searchInput: { flex: 1, fontFamily: fonts.sans.regular, fontSize: 16, color: colors.ink },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  filterChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: space(2), paddingHorizontal: space(3) },
  filterChipOn: { backgroundColor: colors.blue, borderColor: colors.blue },
});
