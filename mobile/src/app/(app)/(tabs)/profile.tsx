/**
 * Profile (screens.md): a user card, then Cuisines & diet and Allergies edited
 * inline via expandable dropdown rows (no sub-screens). Cuisines/diet are a soft
 * bias; allergies feed the hard server guard. Quiet sign-out + a version line.
 */
import { Feather } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { SelectChips } from '@/components/ui/select-chips';
import { AppText } from '@/components/ui/text';
import { WORDMARK } from '@/components/ui/topbar';
import { useIdentity } from '@/lib/identity';
import { ALLERGENS, CUISINES, DIETS } from '@/lib/options';
import { usePrefs } from '@/lib/prefs';
import { saveProfile, type ProfilePrefs } from '@/lib/profile';
import { useSession } from '@/lib/session';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function ProfileScreen() {
  const { cuisines, diets, allergies, setPrefs } = usePrefs();
  const { signOut, session } = useSession();
  const { name, email, provider, initial } = useIdentity();
  const [open, setOpen] = useState<'tastes' | 'allergies' | null>('tastes');

  const userId = session?.user?.id ?? null;
  // Update local prefs immediately, then write through to the profiles table when signed in.
  const update = (next: Partial<ProfilePrefs>) => {
    setPrefs(next);
    if (userId) void saveProfile(userId, { cuisines, diets, allergies, ...next }).catch((err) => console.warn('Could not sync prefs', err));
  };

  const tastesSummary = `${cuisines.length ? cuisines.join(', ') : 'Any cuisine'} · ${diets[0] ?? 'No restriction'}`;
  const allergySummary = allergies.length ? `${allergies.join(', ')} — kept out of every recipe` : 'None set';

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText style={styles.title}>Profile</AppText>

        <View style={styles.me}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initial}</AppText>
          </View>
          <View style={styles.flex}>
            <AppText style={styles.name}>{name}</AppText>
            <AppText variant="meta">
              {email} · via {provider}
            </AppText>
          </View>
        </View>

        <View style={styles.list}>
          <ExpandRow
            icon={<Feather name="sliders" size={21} color={colors.blue} />}
            title="Cuisines & diet"
            subtitle={tastesSummary}
            open={open === 'tastes'}
            onToggle={() => setOpen(open === 'tastes' ? null : 'tastes')}>
            <AppText style={styles.subLabel}>Cuisines</AppText>
            <SelectChips options={CUISINES} selected={cuisines} onToggle={(v) => update({ cuisines: toggleIn(cuisines, v) })} />
            <AppText style={[styles.subLabel, styles.subLabelGap]}>Diet</AppText>
            <SelectChips options={DIETS} selected={diets} onToggle={(v) => update({ diets: diets.includes(v) ? [] : [v] })} />
          </ExpandRow>

          <ExpandRow
            icon={<Feather name="shield" size={21} color={colors.blue} />}
            title="Allergies"
            subtitle={allergySummary}
            open={open === 'allergies'}
            onToggle={() => setOpen(open === 'allergies' ? null : 'allergies')}
            last>
            <AppText style={styles.subLabel}>Keep these out of every recipe</AppText>
            <SelectChips allergen options={ALLERGENS} selected={allergies} onToggle={(v) => update({ allergies: toggleIn(allergies, v) })} />
          </ExpandRow>
        </View>

        <Pressable onPress={() => void signOut()} style={styles.signout} accessibilityRole="button">
          <View style={styles.signoutIcon}>
            <Feather name="log-out" size={20} color={colors.danger} />
          </View>
          <AppText style={styles.signoutText}>Sign out</AppText>
        </Pressable>

        <AppText variant="meta" style={styles.version}>
          {WORDMARK} v1.0
        </AppText>
      </ScrollView>
    </Screen>
  );
}

function ExpandRow({
  icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
  last,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.rowWrap, !last && styles.rowDivider]}>
      <Pressable onPress={onToggle} style={styles.row} accessibilityRole="button">
        <View style={styles.rowIcon}>{icon}</View>
        <View style={styles.flex}>
          <AppText style={styles.rowTitle}>{title}</AppText>
          <AppText variant="meta" numberOfLines={1} style={styles.rowSub}>
            {subtitle}
          </AppText>
        </View>
        <Feather name={open ? 'chevron-down' : 'chevron-right'} size={19} color={colors.muted} />
      </Pressable>
      {open ? <View style={styles.rowBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(8) },
  flex: { flex: 1 },
  title: { fontFamily: fonts.display.semibold, fontSize: 28, color: colors.blue, paddingTop: space(2) },

  me: { flexDirection: 'row', alignItems: 'center', gap: space(4), backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: space(4) + 2, marginTop: space(4), ...shadow.card },
  avatar: { width: 60, height: 60, borderRadius: radius.full, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display.semibold, fontSize: 25, color: colors.white },
  name: { fontFamily: fonts.sans.extrabold, fontSize: 18, color: colors.ink },

  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingHorizontal: space(4), marginTop: space(3), ...shadow.card },
  rowWrap: {},
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3) + 2, paddingVertical: space(4) },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sans.bold, fontSize: 15, color: colors.ink },
  rowSub: { marginTop: 2 },
  rowBody: { paddingBottom: space(4), gap: space(2) },
  subLabel: { fontFamily: fonts.sans.extrabold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted, marginBottom: space(1) },
  subLabelGap: { marginTop: space(3) },

  signout: { flexDirection: 'row', alignItems: 'center', gap: space(3) + 2, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: space(3) + 2, paddingHorizontal: space(4), marginTop: space(3), ...shadow.card },
  signoutIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  signoutText: { fontFamily: fonts.sans.bold, fontSize: 15, color: colors.danger },

  version: { textAlign: 'center', marginTop: space(5) },
});
