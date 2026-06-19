import { Feather } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { IngredientChip } from '@/components/ingredient-chip';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Stepper } from '@/components/ui/stepper';
import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture';
import { useRecipeSession } from '@/lib/recipe-session';
import { colors, fonts, radius, space } from '@/theme/tokens';

export default function ConfirmScreen() {
  const draft = useRecipeSession((s) => s.draftIngredients);
  const servings = useRecipeSession((s) => s.servings);
  const setServings = useRecipeSession((s) => s.setServings);
  const setCount = useRecipeSession((s) => s.setCount);
  const addIngredient = useRecipeSession((s) => s.addIngredient);
  const removeIngredient = useRecipeSession((s) => s.removeIngredient);
  const confirmAndGenerate = useRecipeSession((s) => s.confirmAndGenerate);
  const detectFromImages = useRecipeSession((s) => s.detectFromImages);
  const generating = useRecipeSession((s) => s.generating);
  const detecting = useRecipeSession((s) => s.detecting);
  const navigation = useNavigation();
  const [newName, setNewName] = useState('');

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

  // Add-photo lives in the header (matches the Retake/Add-photo mockup).
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={addPhoto} hitSlop={10} disabled={detecting} style={styles.addPhoto} accessibilityRole="button" accessibilityLabel="add photo">
          <Feather name="plus" size={15} color={colors.blue} />
          <AppText variant="label" color={colors.blue}>
            Add photo
          </AppText>
        </Pressable>
      ),
    });
  }, [navigation, addPhoto, detecting]);

  const onAdd = () => {
    addIngredient(newName);
    setNewName('');
  };

  const onFind = async () => {
    const ok = await confirmAndGenerate();
    if (ok) router.replace('/recipes');
    else Alert.alert('Could not generate recipes', useRecipeSession.getState().error ?? 'Please try again.');
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="overline">Confirm</AppText>
        <AppText variant="h1">What we spotted</AppText>
        <AppText variant="body" color={colors.muted}>
          Remove anything wrong, adjust counts, or add what we missed.
        </AppText>

        {detecting ? (
          <View style={styles.detecting}>
            <ActivityIndicator color={colors.blue} />
            <AppText variant="meta" color={colors.muted}>
              Reading the new photo…
            </AppText>
          </View>
        ) : null}

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
          {draft.length === 0 ? <AppText variant="meta">No ingredients yet — add some below.</AppText> : null}
        </View>

        <View style={styles.addRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Add an ingredient"
            placeholderTextColor={colors.muted}
            style={styles.input}
            onSubmitEditing={onAdd}
            returnKeyType="done"
            autoCapitalize="none"
          />
          <Pressable onPress={onAdd} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="add ingredient">
            <Feather name="plus" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.servingsRow}>
          <View>
            <AppText variant="label">Cooking for</AppText>
            <AppText variant="meta" color={colors.muted}>
              sizes every recipe
            </AppText>
          </View>
          <Stepper value={servings} onChange={setServings} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={generating ? 'Finding recipes…' : 'Find 5 recipes'}
          onPress={onFind}
          loading={generating}
          disabled={draft.length === 0}
          variant="cta"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(6), gap: space(3) },
  addPhoto: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  detecting: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginTop: space(2) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(2) },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginTop: space(2) },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    fontFamily: fonts.sans.regular,
    fontSize: 16,
    color: colors.ink,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space(4),
    marginTop: space(3),
  },
  footer: { padding: space(5), paddingBottom: space(8) },
});
