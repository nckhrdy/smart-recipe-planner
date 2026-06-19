/**
 * Custom bottom nav — Home · Recipes · [raised camera FAB] · Saved · Profile
 * (design polish brief). Replaces the default tab bar so we can centre a raised
 * cobalt FAB with a cream border. Line icons in cobalt (active) / muted
 * (inactive); the active Saved bookmark fills, per the prototypes.
 */
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { colors, fonts, radius, shadow, space } from '@/theme/tokens';

const LABELS: Record<string, string> = {
  index: 'Home',
  recipes: 'Recipes',
  saved: 'Saved',
  profile: 'Profile',
};

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  switch (name) {
    case 'index':
      return <Feather name="home" size={23} color={color} />;
    case 'recipes':
      return <MaterialCommunityIcons name="view-agenda-outline" size={24} color={color} />;
    case 'saved':
      return <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={23} color={color} />;
    case 'profile':
      return <Feather name="user" size={23} color={color} />;
    default:
      return null;
  }
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const go = (routeName: string, key: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(routeName);
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom > 0 ? insets.bottom : space(3) }]}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;

        // Centre slot: the raised camera FAB (the camera tab).
        if (route.name === 'camera') {
          return (
            <View key={route.key} style={styles.slot}>
              <Pressable
                onPress={() => go(route.name, route.key, focused)}
                accessibilityRole="button"
                accessibilityLabel="Snap ingredients"
                style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
                <Feather name="camera" size={27} color={colors.white} />
              </Pressable>
            </View>
          );
        }

        const color = focused ? colors.blue : colors.muted;
        return (
          <Pressable
            key={route.key}
            onPress={() => go(route.name, route.key, focused)}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[route.name]}
            style={styles.slot}>
            <TabIcon name={route.name} color={color} focused={focused} />
            <AppText style={[styles.label, { color }]}>{LABELS[route.name]}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space(3),
  },
  slot: { flex: 1, alignItems: 'center', gap: space(1) },
  label: { fontFamily: fonts.sans.bold, fontSize: 10, letterSpacing: 0.2 },
  fab: {
    width: 62,
    height: 62,
    borderRadius: radius.full,
    backgroundColor: colors.blue,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    ...shadow.fab,
  },
  fabPressed: { backgroundColor: colors.blueDeep },
});
