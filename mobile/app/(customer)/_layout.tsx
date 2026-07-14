import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';

const META = {
  home: { icon: 'home' as const, label: 'Home' },
  search: { icon: 'search' as const, label: 'Search' },
  create: { icon: 'plus' as const, label: 'Request' },
  requests: { icon: 'briefcase' as const, label: 'Orders' },
  profile: { icon: 'user' as const, label: 'Profile' },
};

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
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
