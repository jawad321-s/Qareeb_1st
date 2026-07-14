import React from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { RequestCard } from '@/components/domain/RequestCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useNearbyRequests } from '@/hooks/queries';
import { useAuth } from '@/store/auth';

export default function ArtisanRequests() {
  const user = useAuth((s) => s.user)!;
  const { data, isLoading } = useNearbyRequests(user.uid);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text variant="h1">Nearby jobs</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
          Requests within your service radius
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : (data ?? []).length === 0 ? (
          <View style={{ marginTop: 60 }}>
            <EmptyState icon="briefcase" title="No requests nearby" description="New jobs in your area will appear here in real time." />
          </View>
        ) : (
          (data ?? []).map((r) => (
            <Animated.View key={r.id} entering={FadeIn.duration(300)}>
              <RequestCard request={r} onPress={() => router.push(`/(artisan)/job/${r.id}`)} />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
