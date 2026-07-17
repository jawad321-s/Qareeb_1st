import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';
import { useAuth } from '@/store/auth';

const META = {
  dashboard: { icon: 'home' as const, label: 'tab.home' as const },
  requests: { icon: 'briefcase' as const, label: 'tab.jobs' as const },
  offers: { icon: 'send' as const, label: 'tab.offers' as const },
  income: { icon: 'trending-up' as const, label: 'tab.income' as const },
  profile: { icon: 'user' as const, label: 'tab.profile' as const },
};

export default function ArtisanLayout() {
  // Auth gate for the whole artisan stack — see the customer layout for why this
  // ancestor guard prevents a null-user crash on sign-out.
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/(auth)/welcome" />;

  // No freezeOnBlur — see the customer layout: frozen tabs kept stale theme colors.
  return (
    <Tabs screenOptions={{ headerShown: false, animation: 'shift', lazy: true }} tabBar={(props) => <TabBar {...props} meta={META} />}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="offers" />
      <Tabs.Screen name="income" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
