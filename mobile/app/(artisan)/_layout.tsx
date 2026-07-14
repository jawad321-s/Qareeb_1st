import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';

const META = {
  dashboard: { icon: 'home' as const, label: 'Home' },
  requests: { icon: 'briefcase' as const, label: 'Jobs' },
  offers: { icon: 'send' as const, label: 'Offers' },
  income: { icon: 'trending-up' as const, label: 'Income' },
  profile: { icon: 'user' as const, label: 'Profile' },
};

export default function ArtisanLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} meta={META} />}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="offers" />
      <Tabs.Screen name="income" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
