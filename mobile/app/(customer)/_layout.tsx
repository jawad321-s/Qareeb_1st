import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';
import { useAuth } from '@/store/auth';

const META = {
  home: { icon: 'home' as const, label: 'tab.home' as const },
  search: { icon: 'search' as const, label: 'tab.search' as const },
  create: { icon: 'plus' as const, label: 'tab.request' as const },
  requests: { icon: 'briefcase' as const, label: 'tab.orders' as const },
  profile: { icon: 'user' as const, label: 'tab.profile' as const },
};

export default function CustomerLayout() {
  // Auth gate for the whole customer stack. On sign-out `user` becomes null and
  // this ancestor re-renders first, unmounting every tab screen (which assume a
  // signed-in user) before any of them can read a null `user` and crash.
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/(auth)/welcome" />;
  // Role gate: tab paths like /profile exist in BOTH groups, and an ambiguous
  // link (deep link, post-restart restore) can land an artisan here — showing
  // customer data mixed with artisan theming. Bounce them to their own app.
  if (user.role === 'artisan') return <Redirect href="/(artisan)/dashboard" />;

  return (
    <Tabs
      // No freezeOnBlur: frozen tabs skip re-renders, so a theme/language change
      // made on one tab left the others painted with stale colors (dark cards on
      // a light background). Keeping them live costs little with 5 tabs.
      screenOptions={{ headerShown: false, animation: 'shift', lazy: true }}
      tabBar={(props) => <TabBar {...props} meta={META} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
