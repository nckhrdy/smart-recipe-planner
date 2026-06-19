/**
 * Bottom tab nav — Home · Recipes · Camera (centre FAB) · Saved · Profile.
 * The bar itself is our custom `TabBar` (raised cobalt camera FAB + cream
 * border); expo-router just owns routing. Headers are off — screens render
 * their own topbars/heroes per the prototypes.
 */
import { Tabs } from 'expo-router';

import { TabBar } from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Tabs.Screen name="camera" options={{ title: 'Camera' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
