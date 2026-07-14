import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { RequestCard } from '@/components/domain/RequestCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useMyRequests } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import type { RequestStatus } from '@/types';

type Tab = 'active' | 'completed' | 'all';
const ACTIVE: RequestStatus[] = ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'WORKING'];

export default function Requests() {
  const { colors } = useTheme();
  const user = useAuth((s) => s.user)!;
  const { data, isLoading, refetch } = useMyRequests(user.uid);
  const [tab, setTab] = useState<Tab>('active');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (tab === 'active') return list.filter((r) => ACTIVE.includes(r.status));
    if (tab === 'completed') return list.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');
    return list;
  }, [data, tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text variant="h1" style={{ marginBottom: 16 }}>
          My orders
        </Text>
        {/* Segmented control */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 14, padding: 4 }}>
          {(['active', 'completed', 'all'] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: active ? colors.surface : 'transparent', alignItems: 'center', ...(active ? { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 } : {}) }}
              >
                <Text variant="caption" tone={active ? 'default' : 'muted'} style={{ fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular', textTransform: 'capitalize' }}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        {isLoading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <View style={{ marginTop: 60 }}>
            <EmptyState
              icon="briefcase"
              title={tab === 'active' ? 'No active orders' : 'Nothing here yet'}
              description="When you create a request it will show up here so you can track it."
              actionLabel="Create a request"
              onAction={() => router.push('/(customer)/create')}
            />
          </View>
        ) : (
          filtered.map((r) => (
            <Animated.View key={r.id} entering={FadeIn.duration(300)}>
              <RequestCard request={r} onPress={() => router.push(`/(shared)/request/${r.id}`)} />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
