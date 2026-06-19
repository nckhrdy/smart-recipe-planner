/**
 * CookTimer — a generic, user-set countdown (screens.md: no per-step timers in
 * v1). Collapsed to a tappable button by default; tap to reveal the ring,
 * presets, a custom-minutes field, and Start. The ring is the one place orange
 * earns its keep on this screen, matching the recipe-detail prototype.
 */
import { Feather, Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/text';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

const PRESETS = [5, 10, 20, 30] as const; // minutes
const MAX_MINUTES = 999; // hard cap — keeps the ring readable and input sane
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const isPreset = (minutes: number): boolean => (PRESETS as readonly number[]).includes(minutes);

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CookTimer({ defaultMinutes = 20 }: { defaultMinutes?: number }) {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(defaultMinutes * 60);
  const [remaining, setRemaining] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  // Seed the custom field when the recipe's default isn't one of the presets.
  const [customText, setCustomText] = useState(() => (isPreset(defaultMinutes) ? '' : String(defaultMinutes)));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const customRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const applyMinutes = (minutes: number) => {
    setRunning(false);
    setTotal(minutes * 60);
    setRemaining(minutes * 60);
  };

  const selectPreset = (minutes: number) => {
    setCustomText('');
    applyMinutes(minutes);
  };

  // Validate at the boundary: keep digits only, clamp to 1..MAX_MINUTES.
  const onChangeCustom = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 3);
    setCustomText(digits);
    const minutes = Number(digits);
    if (minutes >= 1 && minutes <= MAX_MINUTES) applyMinutes(minutes);
  };

  const toggleRun = () => {
    if (remaining === 0) {
      setRemaining(total);
      setRunning(true);
    } else {
      setRunning((v) => !v);
    }
  };

  const progress = total > 0 ? remaining / total : 0;
  const selectedMinutes = total / 60;
  const customActive = !isPreset(selectedMinutes);
  const startLabel = running ? 'Pause' : remaining === 0 ? 'Restart' : remaining < total ? 'Resume' : 'Start timer';

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.toggle} accessibilityRole="button">
        <View style={styles.iconBox}>
          <Ionicons name="timer-outline" size={21} color={colors.blue} />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.toggleTitle}>Cook timer</AppText>
          <AppText style={styles.toggleSub}>{running ? `${format(remaining)} remaining` : 'Tap to set a countdown'}</AppText>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <View style={styles.ringWrap}>
            <Svg width={120} height={120} viewBox="0 0 100 100">
              <Circle cx={50} cy={50} r={RADIUS} fill="none" stroke={colors.blueSoft} strokeWidth={7} />
              <Circle
                cx={50}
                cy={50}
                r={RADIUS}
                fill="none"
                stroke={colors.orange}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                rotation={-90}
                originX={50}
                originY={50}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <AppText style={styles.ringTime}>{format(remaining)}</AppText>
              <AppText style={styles.ringUnit}>minutes</AppText>
            </View>
          </View>

          <View style={styles.presets}>
            {PRESETS.map((m) => {
              const on = m === selectedMinutes;
              return (
                <Pressable key={m} onPress={() => selectPreset(m)} style={[styles.preset, on && styles.presetOn]} accessibilityRole="button">
                  <AppText style={[styles.presetText, on && styles.presetTextOn]}>{m}</AppText>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => customRef.current?.focus()}
              style={[styles.preset, styles.customPreset, customActive && styles.presetOn]}
              accessibilityRole="button"
              accessibilityLabel="Set a custom time in minutes"
            >
              <Feather name="edit-2" size={11} color={customActive ? colors.white : colors.muted} />
              <TextInput
                ref={customRef}
                value={customText}
                onChangeText={onChangeCustom}
                placeholder="Min"
                placeholderTextColor={customActive ? 'rgba(255,255,255,0.85)' : colors.muted}
                keyboardType="number-pad"
                maxLength={3}
                returnKeyType="done"
                accessibilityLabel="Custom minutes"
                style={[styles.presetText, styles.customInput, customActive && styles.presetTextOn]}
              />
            </Pressable>
          </View>

          <Pressable onPress={toggleRun} style={({ pressed }) => [styles.start, pressed && styles.startPressed]} accessibilityRole="button">
            <Feather name={running ? 'pause' : 'play'} size={17} color={colors.white} />
            <AppText style={styles.startText}>{startLabel}</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, overflow: 'hidden', ...shadow.card },
  flex: { flex: 1 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space(3), padding: space(4) },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { fontFamily: fonts.sans.extrabold, fontSize: 15, color: colors.ink },
  toggleSub: { fontFamily: fonts.sans.medium, fontSize: 12.5, color: colors.muted, marginTop: 1 },

  body: { borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: space(4), paddingBottom: space(4) },
  ringWrap: { width: 120, height: 120, alignSelf: 'center', marginTop: space(4), marginBottom: space(1) },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringTime: { fontFamily: fonts.sans.extrabold, fontSize: 26, lineHeight: 34, color: colors.blue, letterSpacing: -0.5, includeFontPadding: false },
  ringUnit: { fontFamily: fonts.sans.semibold, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.muted, marginTop: 1 },

  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), justifyContent: 'center', marginTop: space(3) },
  preset: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: space(3), paddingVertical: space(2), minWidth: 44, alignItems: 'center' },
  presetOn: { backgroundColor: colors.blue, borderColor: colors.blue },
  presetText: { fontFamily: fonts.sans.bold, fontSize: 13, color: colors.ink },
  presetTextOn: { color: colors.white },
  customPreset: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  customInput: { minWidth: 30, padding: 0, textAlign: 'center', includeFontPadding: false },

  start: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(2), marginTop: space(3), paddingVertical: space(3), borderRadius: radius.md, backgroundColor: colors.orange, ...shadow.cta },
  startPressed: { backgroundColor: colors.orangePress },
  startText: { fontFamily: fonts.sans.bold, fontSize: 14.5, color: colors.white },
});
