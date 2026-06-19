/**
 * Recipe List — the five generated recipes from the latest photo, plus Refresh
 * for a new non-repeating set (ADR-0004). Matches the prototype: Fredoka hero,
 * an ingredient context strip (detected chips + Edit), an orange Refresh pill,
 * and the indexed recipe cards. Empty / loading / exhaustion are defined states.
 */
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecipeCard } from '@/components/recipe-card';
import { StrawberryDoodle } from '@/components/ui/doodles';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { Topbar } from '@/components/ui/topbar';
import { useIdentity } from '@/lib/identity';
import { useRecipeSession } from '@/lib/recipe-session';
import { useSaved } from '@/lib/saved';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

const CHIP_LIMIT = 6;

export default function RecipeListScreen() {
  const recipes = useRecipeSession((s) => s.recipes);
  const draft = useRecipeSession((s) => s.draftIngredients);
  const generating = useRecipeSession((s) => s.generating);
  const exhausted = useRecipeSession((s) => s.exhausted);
  const hasGenerated = useRecipeSession((s) => s.hasGenerated);
  const refresh = useRecipeSession((s) => s.refresh);
  const savedRecipes = useSaved((s) => s.recipes);
  const toggle = useSaved((s) => s.toggle);
  const { initial } = useIdentity();
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
          <AppText variant="meta" style={styles.centerText}>
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
          <StrawberryDoodle size={84} />
          <AppText variant="display" style={[styles.centerText, styles.emptyTitle]}>
            Nothing here yet
          </AppText>
          <AppText variant="body" style={styles.centerText}>
            Snap your ingredients and your five recipes land right here.
          </AppText>
          <Pressable onPress={() => router.push('/camera')} style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]} accessibilityRole="button">
            <Feather name="camera" size={17} color={colors.white} />
            <AppText style={styles.emptyCtaText}>Snap something</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const extra = draft.length - CHIP_LIMIT;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.gutter}>
          <Topbar initial={initial} />

          <View style={styles.hero}>
            <AppText variant="overline">From your photo</AppText>
            <AppText variant="display" style={styles.heroTitle}>
              Tonight&apos;s{'\n'}five<Text style={styles.period}>.</Text>
            </AppText>
            <AppText variant="meta" style={styles.heroSub}>
              Cook with what you&apos;ve already got.
            </AppText>
          </View>

          {draft.length > 0 ? (
            <View style={styles.ctx}>
              <View style={styles.ctxHead}>
                <View style={styles.ctxLabel}>
                  <View style={styles.thumb}>
                    <Feather name="camera" size={16} color={colors.blue} />
                  </View>
                  <AppText style={styles.ctxCount}>
                    {draft.length} ingredient{draft.length === 1 ? '' : 's'} spotted
                  </AppText>
                </View>
                <Pressable onPress={() => router.push('/confirm')} style={styles.edit} accessibilityRole="button">
                  <AppText style={styles.editText}>Edit</AppText>
                  <Feather name="edit-2" size={13} color={colors.blue} />
                </Pressable>
              </View>
              <View style={styles.chips}>
                {draft.slice(0, CHIP_LIMIT).map((ing, i) => (
                  <View key={`${ing.name}-${i}`} style={styles.chip}>
                    <AppText style={styles.chipText} numberOfLines={1}>
                      {ing.name}
                    </AppText>
                  </View>
                ))}
                {extra > 0 ? <AppText style={styles.chipMore}>+{extra}</AppText> : null}
              </View>
            </View>
          ) : null}

          <View style={styles.listHead}>
            <AppText style={styles.listHeadText}>{recipes.length} ideas</AppText>
            <Pressable
              onPress={() => void refresh()}
              disabled={generating}
              accessibilityRole="button"
              style={({ pressed }) => [styles.refresh, pressed && styles.refreshPressed, generating && styles.refreshBusy]}>
              {generating ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Feather name="refresh-cw" size={14} color={colors.white} />
              )}
              <AppText style={styles.refreshText}>{generating ? 'Refreshing' : 'Refresh'}</AppText>
            </Pressable>
          </View>
        </View>

        <View style={styles.cards}>
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
            <AppText variant="meta" style={styles.exhaust}>
              You&apos;ve explored these — add an ingredient or start a new photo for more.
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: space(2), paddingBottom: space(8) },
  gutter: { paddingHorizontal: space(5) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(3) },
  centerText: { textAlign: 'center' },
  emptyTitle: { marginTop: space(2) },
  emptyCta: { flexDirection: 'row', alignItems: 'center', gap: space(2), backgroundColor: colors.orange, borderRadius: radius.md, paddingVertical: space(3), paddingHorizontal: space(5), marginTop: space(2), ...shadow.cta },
  emptyCtaPressed: { backgroundColor: colors.orangePress },
  emptyCtaText: { fontFamily: fonts.sans.bold, fontSize: 14.5, color: colors.white },

  hero: { paddingTop: space(3) },
  heroTitle: { marginTop: space(2) },
  period: { color: colors.orange },
  heroSub: { marginTop: space(2) },

  ctx: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: space(3), marginTop: space(4) },
  ctxHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctxLabel: { flexDirection: 'row', alignItems: 'center', gap: space(2), flex: 1 },
  thumb: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  ctxCount: { fontFamily: fonts.sans.bold, fontSize: 13, color: colors.ink },
  edit: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  editText: { fontFamily: fonts.sans.bold, fontSize: 12.5, color: colors.blue },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space(2), marginTop: space(3) },
  chip: { backgroundColor: colors.blueSoft, borderRadius: radius.full, paddingHorizontal: space(3), paddingVertical: 5 },
  chipText: { fontFamily: fonts.sans.semibold, fontSize: 11.5, color: colors.blueDeep, textTransform: 'capitalize' },
  chipMore: { fontFamily: fonts.sans.semibold, fontSize: 11.5, color: colors.muted, paddingHorizontal: space(1) },

  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space(6) },
  listHeadText: { fontFamily: fonts.sans.extrabold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.ink },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: space(2), backgroundColor: colors.orange, borderRadius: radius.full, paddingVertical: space(2), paddingHorizontal: space(3), ...shadow.cta },
  refreshPressed: { backgroundColor: colors.orangePress },
  refreshBusy: { opacity: 0.85 },
  refreshText: { fontFamily: fonts.sans.bold, fontSize: 12.5, color: colors.white },

  cards: { paddingHorizontal: space(5), paddingTop: space(3), gap: space(3) },
  exhaust: { textAlign: 'center', paddingHorizontal: space(4), marginTop: space(2) },
});
