import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AppText } from '@/components/ui/text';
import { pickImages } from '@/lib/capture';
import { useRecipeSession } from '@/lib/recipe-session';
import type { CapturedImage } from '@/lib/types';
import { colors, radius, shadow, space } from '@/theme/tokens';

const MAX_PHOTOS = 5;

export default function CameraScreen() {
  const detecting = useRecipeSession((s) => s.detecting);
  const detectFromImages = useRecipeSession((s) => s.detectFromImages);
  const reset = useRecipeSession((s) => s.reset);
  const [staged, setStaged] = useState<CapturedImage[]>([]);
  const [busy, setBusy] = useState(false);

  const add = async (mode: 'camera' | 'library') => {
    setBusy(true);
    try {
      const images = await pickImages(mode);
      if (images) setStaged((prev) => [...prev, ...images].slice(0, MAX_PHOTOS));
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index: number) => setStaged((prev) => prev.filter((_, i) => i !== index));

  const scan = async () => {
    if (staged.length === 0) return;
    reset(); // a new capture starts a fresh session
    const ok = await detectFromImages(staged);
    if (ok) {
      setStaged([]);
      router.push('/confirm');
    } else {
      Alert.alert('Could not read the photos', useRecipeSession.getState().error ?? 'Please try again.');
    }
  };

  const working = busy || detecting;
  const hasPhotos = staged.length > 0;
  const full = staged.length >= MAX_PHOTOS;

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Feather name="camera" size={38} color={colors.white} />
          </View>
          <AppText variant="display" style={styles.center}>
            Snap your ingredients
          </AppText>
          <AppText variant="body" color={colors.muted} style={styles.center}>
            Add one or more photos — fridge, pantry, counter — then scan them together.
          </AppText>
        </View>

        {hasPhotos ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray}>
            {staged.map((img, i) => (
              <View key={i} style={styles.thumbWrap}>
                <Image source={{ uri: img.uri ?? `data:${img.mediaType};base64,${img.data}` }} style={styles.thumb} />
                <Pressable onPress={() => removeAt(i)} hitSlop={6} style={styles.thumbRemove} accessibilityRole="button" accessibilityLabel="remove photo">
                  <Ionicons name="close-circle" size={22} color={colors.ink} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.actions}>
          <View style={styles.captureRow}>
            {Platform.OS !== 'web' ? (
              <Button
                label={hasPhotos ? 'Take another' : 'Take a photo'}
                variant={hasPhotos ? 'ghost' : 'primary'}
                onPress={() => add('camera')}
                disabled={working || full}
                style={styles.flex}
              />
            ) : null}
            <Button
              label="Library"
              variant={hasPhotos ? 'ghost' : 'primary'}
              onPress={() => add('library')}
              disabled={working || full}
              style={styles.flex}
            />
          </View>
          {hasPhotos ? (
            <Button
              label={detecting ? 'Scanning…' : `Scan ${staged.length} photo${staged.length > 1 ? 's' : ''}`}
              variant="cta"
              loading={detecting}
              onPress={scan}
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingVertical: space(6) },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(4) },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: radius.full,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.fab,
  },
  center: { textAlign: 'center' },
  tray: { gap: space(3), paddingVertical: space(3), paddingHorizontal: space(1) },
  thumbWrap: { position: 'relative' },
  thumb: { width: 92, height: 92, borderRadius: radius.lg, backgroundColor: colors.blueSoft },
  thumbRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.surface, borderRadius: radius.full },
  actions: { gap: space(3) },
  captureRow: { flexDirection: 'row', gap: space(3) },
  flex: { flex: 1 },
});
