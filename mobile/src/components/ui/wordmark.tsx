/**
 * Wordmark — the "Always Hungry" brand logo as an image (white type with the
 * cobalt 3D shadow), rasterized from the source SVG to a trimmed, transparent
 * PNG. Pass `width`; height is derived from the artwork's intrinsic aspect so
 * it never distorts. For the plain Fredoka text wordmark see topbar.tsx.
 */
import { Image } from 'expo-image';
import { type StyleProp, type ImageStyle } from 'react-native';

import source from '@/assets/wordmark.png';

const ASPECT = 900 / 437; // intrinsic width / height of the trimmed asset

export interface WordmarkProps {
  /** Rendered width in px; height follows the artwork aspect ratio. */
  width?: number;
  style?: StyleProp<ImageStyle>;
}

export function Wordmark({ width = 200, style }: WordmarkProps) {
  return (
    <Image
      source={source}
      style={[{ width, height: width / ASPECT }, style]}
      contentFit="contain"
      accessibilityLabel="Always Hungry"
    />
  );
}
