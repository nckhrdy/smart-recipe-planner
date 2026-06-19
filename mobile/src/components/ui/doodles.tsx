/**
 * Single-line cobalt doodles — the delight layer in hero/empty/footer states
 * (design-tokens §7). Paths lifted verbatim from the prototypes so the weight
 * matches the strawberry backdrop. Default color is cobalt; pass `color` to
 * draw on a dark surface (e.g. white on the cobalt snap hero).
 */
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export interface DoodleProps {
  size?: number;
  color?: string;
  /** 0–1; the prototypes draw footer/empty doodles slightly faded. */
  opacity?: number;
}

export function StrawberryDoodle({ size = 92, color = colors.blue, opacity = 1 }: DoodleProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <Path d="M50 38c16 0 27 9 27 21 0 16-15 31-27 33C38 90 23 77 23 59c0-12 11-21 27-21z" />
      <Path d="M50 38c-3-8-9-12-16-11M50 38c3-8 9-12 16-11M50 38V25" />
      <Path d="M40 54l1 2M52 52l1 2M46 64l1 2M58 60l1 2M37 68l1 2" />
    </Svg>
  );
}

export function PotDoodle({ size = 58, color = colors.blue, opacity = 0.75 }: DoodleProps) {
  const h = (size * 54) / 64;
  return (
    <Svg width={size} height={h} viewBox="0 0 64 54" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <Path d="M22 13c0-5 6-4 6-9M32 13c0-5 6-4 6-9M42 13c0-5 6-4 6-9" opacity={0.85} />
      <Path d="M11 22h42l-3.5 25a4.5 4.5 0 0 1-4.5 4H19a4.5 4.5 0 0 1-4.5-4z" />
      <Path d="M7 23h5M52 23h5" />
    </Svg>
  );
}

export function BookmarkDoodle({ size = 76, color = colors.blue, opacity = 0.8 }: DoodleProps) {
  const h = (size * 54) / 64;
  return (
    <Svg width={size} height={h} viewBox="0 0 64 54" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <Path d="M18 8h28v40l-14-9-14 9z" />
      <Path d="M26 22h12M26 29h8" />
    </Svg>
  );
}
