import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { RequestCard } from '@/components/domain/RequestCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useArtisan, useArtisanJobs, useNearbyRequests } from '@/hooks/queries';
import { config } from '@/lib/config';
import { REQUIRE_VERIFIED } from '@/lib/dispatch';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { useT } from '@/i18n';

export default function ArtisanRequests() {
  const user = useAuth((s) => s.user)!;
  const { t } = useT();
  const { colors } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useNearbyRequests(user.uid, user.location);
  // Jobs already assigned to this artisan — open them to move on or finish.
  const jobs = useArtisanJobs(user.uid);
  const profile = useArtisan(user.uid);

  // Why the feed may be empty: requests only reach verified artisans with a
  // saved location, in the categories they offer.
  const hasServices = (profile.data?.profile.categoryIds ?? []).length > 0;
  const blocker = config.useMock
    ? null
    : REQUIRE_VERIFIED && !user.verified
      ? { icon: 'shield' as const, title: t('aJobs.notVerified'), desc: t('aJobs.notVerifiedDesc') }
      : !user.location
        ? { icon: 'map-pin' as const, title: t('aJobs.noLocation'), desc: t('aJobs.noLocationDesc') }
        : profile.data && !hasServices
          ? { icon: 'tools' as const, title: t('aJobs.noServices'), desc: t('aJobs.noServicesDesc') }
          : null;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text variant="h1">{t('aJobs.title')}</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
          {t('aJobs.subtitle')}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); jobs.refetch(); }} tintColor={colors.tint} />}
      >
        {(jobs.data ?? []).length > 0 && (
          <View style={{ gap: 12, marginBottom: 8 }}>
            <Text variant="h3">{t('aJobs.active')}</Text>
            {(jobs.data ?? []).map((r) => (
              <RequestCard key={r.id} request={r} onPress={() => router.push(`/(artisan)/job/${r.id}`)} />
            ))}
            <Text variant="h3" style={{ marginTop: 12 }}>
              {t('aJobs.nearby')}
            </Text>
          </View>
        )}
        {isLoading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : (data ?? []).length === 0 ? (
          <View style={{ marginTop: 60 }}>
            <EmptyState
              icon={blocker?.icon ?? 'briefcase'}
              title={blocker?.title ?? t('aJobs.empty')}
              description={blocker?.desc ?? t('aJobs.emptyDesc')}
            />
          </View>
        ) : (
          (data ?? []).map((r) => (
            <Animated.View key={r.id} entering={FadeIn.duration(300)}>
              <RequestCard request={r} distanceKm={r.distanceKm} onPress={() => router.push(`/(artisan)/job/${r.id}`)} />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
