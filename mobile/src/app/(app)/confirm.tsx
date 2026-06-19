/**
 * Confirm — the human-in-the-loop step before any recipe generates. Correct what
 * the AI saw (removable cobalt chips, counts on countable items), add what it
 * missed via a tap-to-pick list (no typing — screens.md), and set who you're
 * cooking for. One primary action: Find 5 recipes. Matches the confirm prototype.
 */
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { IngredientChip } from '@/components/ingredient-chip';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { Stepper } from '@/components/ui/stepper';
import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture';
import { COMMON_INGREDIENTS } from '@/lib/options';
import { useRecipeSession } from '@/lib/recipe-session';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

export default function ConfirmScreen() {
  const draft = useRecipeSession((s) => s.draftIngredients);
  const servings = useRecipeSession((s) => s.servings);
  const setServings = useRecipeSession((s) => s.setServings);
  const setCount = useRecipeSession((s) => s.setCount);
  const addIngredient = useRecipeSession((s) => s.addIngredient);
  const removeIngredient = useRecipeSession((s) => s.removeIngredient);
  const confirmAndGenerate = useRecipeSession((s) => s.confirmAndGenerate);
  const detectFromImages = useRecipeSession((s) => s.detectFromImages);
  const reset = useRecipeSession((s) => s.reset);
  const generating = useRecipeSession((s) => s.generating);
  const detecting = useRecipeSession((s) => s.detecting);
  const [picking, setPicking] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/camera'));

  const addFrom = useCallback(
    async (mode: 'camera' | 'library') => {
      const images = await pickImages(mode);
      if (!images) return;
      const ok = await detectFromImages(images); // merges into the existing draft
      if (!ok) Alert.alert('Could not read that photo', useRecipeSession.getState().error ?? 'Please try again.');
    },
    [detectFromImages],
  );

  const addPhoto = useCallback(() => {
    Alert.alert('Add a photo', 'Snap another shot or pick from your library — ingredients merge.', [
      { text: 'Take photo', onPress: () => void addFrom('camera') },
      { text: 'Choose from library', onPress: () => void addFrom('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [addFrom]);

  const retake = useCallback(() => {
    reset();
    router.replace('/camera');
  }, [reset]);

  const onFind = async () => {
    const ok = await confirmAndGenerate();
    if (ok) router.replace('/recipes');
    else Alert.alert('Could not generate recipes', useRecipeSession.getState().error ?? 'Please try again.');
  };

  const available = useMemo(() => {
    const have = new Set(draft.map((d) => d.name));
    return COMMON_INGREDIENTS.filter((name) => !have.has(name));
  }, [draft]);

  return (
    <Screen padded={false}>
      <View style={styles.gutter}>
        <View style={styles.header}>
          <IconButton onPress={goBack} accessibilityLabel="back">
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </IconButton>
          <View style={styles.topActions}>
            <Pressable onPress={retake} style={styles.pillBtn} accessibilityRole="button">
              <Feather name="rotate-ccw" size={14} color={colors.blue} />
              <AppText style={styles.pillBtnText}>Retake</AppText>
            </Pressable>
            <Pressable onPress={addPhoto} disabled={detecting} style={styles.pillBtn} accessibilityRole="button">
              <Feather name="image" size={14} color={colors.blue} />
              <AppText style={styles.pillBtnText}>Add photo</AppText>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText variant="overline" color={colors.blue}>
            From your photos
          </AppText>
          <AppText style={styles.heroTitle}>
            We spotted {draft.length} thing{draft.length === 1 ? '' : 's'}
          </AppText>
          <AppText variant="meta" style={styles.heroSub}>
            Remove anything wrong, adjust counts, or add what we missed.
          </AppText>
        </View>

        {detecting ? (
          <View style={styles.detecting}>
            <ActivityIndicator color={colors.blue} />
            <AppText variant="meta">Reading the new photo…</AppText>
          </View>
        ) : null}

        <View style={styles.panel}>
          <AppText style={styles.panelHead}>Your ingredients</AppText>
          <View style={styles.chips}>
            {draft.map((ing, i) => (
              <IngredientChip
                key={`${ing.name}-${i}`}
                name={ing.name}
                count={ing.count}
                onRemove={() => removeIngredient(i)}
                onCountChange={(n) => setCount(i, n)}
              />
            ))}
            <Pressable onPress={() => setPicking(true)} style={styles.addChip} accessibilityRole="button">
              <Feather name="plus" size={15} color={colors.blue} />
              <AppText style={styles.addChipText}>Add</AppText>
            </Pressable>
          </View>
          {draft.length === 0 ? (
            <AppText variant="meta" style={styles.empty}>
              Nothing yet — tap Add to pick ingredients, or Add photo to scan more.
            </AppText>
          ) : (
            <AppText variant="meta" style={styles.note}>
              Tap × to remove · adjust counts with − / + · Add to pick from a list or type your own.
            </AppText>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.servRow}>
            <View style={styles.flex}>
              <AppText style={styles.servTitle}>Cooking for</AppText>
              <AppText variant="meta">We&apos;ll size every recipe to this.</AppText>
            </View>
            <Stepper value={servings} onChange={setServings} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void onFind()}
          disabled={draft.length === 0 || generating}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            (draft.length === 0 || generating) && styles.ctaDisabled,
          ]}>
          {generating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Feather name="arrow-right" size={18} color={colors.white} />
              <AppText style={styles.ctaText}>Find 5 recipes</AppText>
            </>
          )}
        </Pressable>
      </View>

      <AddPicker
        visible={picking}
        options={available}
        existing={draft.map((d) => d.name)}
        onPick={addIngredient}
        onClose={() => setPicking(false)}
      />
    </Screen>
  );
}

function AddPicker({
  visible,
  options,
  existing,
  onPick,
  onClose,
}: {
  visible: boolean;
  options: string[];
  existing: string[];
  onPick: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.includes(q)) : options;
  // Offer a free-text add when the typed value isn't already a list option or in the draft.
  const canAddCustom = q.length > 0 && !existing.includes(q) && !options.includes(q);

  const addCustom = () => {
    if (!q) return;
    onPick(query.trim());
    setQuery('');
  };

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <AppText variant="sectionHero">Add an ingredient</AppText>
            <Pressable onPress={close} accessibilityRole="button">
              <AppText style={styles.done}>Done</AppText>
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Feather name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search the list or type your own"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={addCustom}
            />
          </View>

          <ScrollView contentContainerStyle={styles.sheetChips} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {canAddCustom ? (
              <Pressable onPress={addCustom} style={[styles.pickChip, styles.pickChipCustom]} accessibilityRole="button">
                <Feather name="plus" size={13} color={colors.white} />
                <AppText style={[styles.pickChipText, styles.pickChipTextCustom]}>Add “{query.trim()}”</AppText>
              </Pressable>
            ) : null}
            {filtered.map((name) => (
              <Pressable key={name} onPress={() => onPick(name)} style={styles.pickChip} accessibilityRole="button">
                <Feather name="plus" size={13} color={colors.blueDeep} />
                <AppText style={styles.pickChipText}>{name}</AppText>
              </Pressable>
            ))}
            {filtered.length === 0 && !canAddCustom ? (
              <AppText variant="meta">
                {options.length === 0 ? 'You’ve added everything on the list.' : 'No matches — keep typing to add your own.'}
              </AppText>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: space(5) },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space(2), paddingBottom: space(1) },
  topActions: { flexDirection: 'row', gap: space(2) },
  pillBtn: { flexDirection: 'row', alignItems: 'center', gap: space(1) + 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingVertical: space(2), paddingHorizontal: space(3) },
  pillBtnText: { fontFamily: fonts.sans.bold, fontSize: 12.5, color: colors.blue },

  scroll: { paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(6), gap: space(4) },
  hero: { paddingTop: space(2) },
  heroTitle: { fontFamily: fonts.display.semibold, fontSize: 30, lineHeight: 32, color: colors.blue, marginTop: space(2) },
  heroSub: { marginTop: space(2) },

  detecting: { flexDirection: 'row', alignItems: 'center', gap: space(2) },

  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: space(4), ...shadow.card },
  panelHead: { fontFamily: fonts.sans.extrabold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.ink, marginBottom: space(3) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), alignItems: 'center' },
  addChip: { flexDirection: 'row', alignItems: 'center', gap: space(1) + 1, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.full, paddingVertical: space(2), paddingHorizontal: space(3) + 1 },
  addChipText: { fontFamily: fonts.sans.bold, fontSize: 13.5, color: colors.blue },
  note: { marginTop: space(3) },
  empty: { marginTop: space(3) },

  servRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  servTitle: { fontFamily: fonts.sans.extrabold, fontSize: 15, color: colors.ink },

  footer: { paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(8) },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(2), backgroundColor: colors.orange, borderRadius: radius.lg, paddingVertical: space(4), ...shadow.cta },
  ctaPressed: { backgroundColor: colors.orangePress },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: fonts.sans.bold, fontSize: 15.5, color: colors.white },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(34,32,59,0.4)' },
  sheet: { maxHeight: '80%', backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(8) },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.full, backgroundColor: colors.border, marginBottom: space(3) },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  done: { fontFamily: fonts.sans.bold, fontSize: 15, color: colors.blue },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space(3) + 1, paddingVertical: space(3), marginTop: space(3), marginBottom: space(3) },
  searchInput: { flex: 1, fontFamily: fonts.sans.medium, fontSize: 15, color: colors.ink, padding: 0 },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), paddingBottom: space(4) },
  pickChip: { flexDirection: 'row', alignItems: 'center', gap: space(1) + 1, backgroundColor: colors.blueSoft, borderRadius: radius.full, paddingVertical: space(2) + 1, paddingHorizontal: space(3) + 1 },
  pickChipText: { fontFamily: fonts.sans.semibold, fontSize: 13.5, color: colors.blueDeep, textTransform: 'capitalize' },
  pickChipCustom: { backgroundColor: colors.blue },
  pickChipTextCustom: { color: colors.white },
});
