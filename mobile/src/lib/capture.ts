// Shared photo picker. Library allows multi-select; camera is single-shot
// (use "Add photo" on Confirm to stack more camera shots). Returns base64
// images, or null if the user cancelled / nothing was readable.

import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import type { CapturedImage } from '@/lib/types';

export async function pickImages(mode: 'camera' | 'library'): Promise<CapturedImage[] | null> {
  if (mode === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Enable camera access to snap your ingredients.');
      return null;
    }
  }

  const result =
    mode === 'camera'
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          base64: true,
          quality: 0.6,
          allowsMultipleSelection: true,
          selectionLimit: 5,
        });
  if (result.canceled) return null;

  const images = result.assets
    .filter((a) => a.base64)
    .map((a) => ({ data: a.base64 as string, mediaType: a.mimeType ?? 'image/jpeg', uri: a.uri }));
  if (images.length === 0) {
    Alert.alert('Could not read that image', 'Please try another photo.');
    return null;
  }
  return images;
}
