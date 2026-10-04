import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
// SDK 57 moved the JS tab navigator out of the root entry point.
import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/ui/TabBar';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { usePendingReview } from '@/hooks/queries';
import { useEnsureTrial } from '@/store/subscription';

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
  const { colors } = useTheme();
  // Called before the early returns below (rules of hooks); idle until signed in.
  const pendingReview = usePendingReview(user);
  // Every artisan starts on the one-time 7-day free trial.
  useEnsureTrial(user?.uid, user?.role === 'artisan');
  if (!user) return <Redirect href="/(auth)/welcome" />;
  // Role gate — see the customer layout: ambiguous tab paths must not land a
  // customer inside the artisan app.
  if (user.role !== 'artisan') return <Redirect href="/(customer)/home" />;
  // Rating is mandatory once a job is completed — for both sides. Until this
  // user has rated every finished job they took part in, the app opens the
  // review instead of the tabs.
  // Hold the tabs until the check is done, so they don't flash before the review.
  if (pendingReview.isLoading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (pendingReview.data) {
    return <Redirect href={{ pathname: '/(shared)/review/[id]', params: { id: pendingReview.data.id } }} />;
  }

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
