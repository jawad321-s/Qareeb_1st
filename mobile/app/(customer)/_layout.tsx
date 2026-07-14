import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';

const META = {
  home: { icon: 'home' as const, label: 'tab.home' as const },
  search: { icon: 'search' as const, label: 'tab.search' as const },
  create: { icon: 'plus' as const, label: 'tab.request' as const },
  requests: { icon: 'briefcase' as const, label: 'tab.orders' as const },
  profile: { icon: 'user' as const, label: 'tab.profile' as const },
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
