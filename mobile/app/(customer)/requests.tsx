import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Segmented } from '@/components/ui/Segmented';
import { RequestCard } from '@/components/domain/RequestCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useMyRequests } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useT } from '@/i18n';
import type { RequestStatus } from '@/types';
import { nobodyTook } from '@/lib/requestRules';
import { useTabBarSpace } from '@/components/ui/TabBar';

type Tab = 'active' | 'completed' | 'rejected' | 'cancelled' | 'all';
const ACTIVE: RequestStatus[] = ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'WORKING'];

export default function Requests() {
  const tabBarSpace = useTabBarSpace(); // keeps the last item clear of the floating tab bar
  const { t } = useT();
  const user = useAuth((s) => s.user)!;
  const { data, isLoading, refetch } = useMyRequests(user.uid);
  const [tab, setTab] = useState<Tab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (tab === 'active') return list.filter((r) => ACTIVE.includes(r.status));
    if (tab === 'completed') return list.filter((r) => r.status === 'COMPLETED');
    // Rejected: closed with nobody taking it. Cancelled: called off by the
    // customer or the artisan (or over the open-requests limit).
    if (tab === 'rejected') return list.filter((r) => nobodyTook(r));
    if (tab === 'cancelled') return list.filter((r) => r.status === 'CANCELLED' && !nobodyTook(r));
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
          {t('orders.title')}
        </Text>
        <Segmented<Tab>
          options={[
            { key: 'active', label: t('orders.active') },
            { key: 'completed', label: t('orders.completed') },
            { key: 'rejected', label: t('orders.rejected') },
            { key: 'cancelled', label: t('orders.cancelled') },
            { key: 'all', label: t('orders.all') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: tabBarSpace + 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        {isLoading ? (
          [0, 1, 2].map((i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 && (data ?? []).length > 0 ? (
          <View style={{ marginTop: 60 }}>
            <EmptyState icon="briefcase" title={t('orders.emptyTab')} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ marginTop: 60 }}>
            <EmptyState
              icon="briefcase"
              title={t('orders.empty')}
              description={t('orders.emptyDesc')}
              actionLabel={t('orders.createCta')}
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
