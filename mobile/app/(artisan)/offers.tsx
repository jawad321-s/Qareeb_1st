import React, { useCallback, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Segmented } from '@/components/ui/Segmented';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { Icon } from '@/components/ui/Icon';
import { formatMoney, timeAgo } from '@/lib/format';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { categoryById } from '@/constants/categories';
import { inOfferTab, offerState, type OfferTab } from '@/lib/offerStatus';
import { useArtisanOffers } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useT } from '@/i18n';
import type { OfferStatus } from '@/types';

const STATUS_VARIANT: Record<OfferStatus, React.ComponentProps<typeof Badge>['variant']> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

export default function ArtisanOffers() {
  const { t, locale } = useT();
  const uid = useAuth((s) => s.user?.uid ?? '');
  // The signed-in artisan's own offers, newest first.
  const { data: offers, isLoading, refetch } = useArtisanOffers(uid);
  const [tab, setTab] = useState<OfferTab>('active');
  // Tabs stay mounted: pick up jobs that moved on (or were cancelled) meanwhile.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );
  const shown = (offers ?? []).filter((o) => inOfferTab(o, tab));

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text variant="h1" style={{ marginBottom: 16 }}>
          {t('aOffers.title')}
        </Text>
        <Segmented<OfferTab>
          options={[
            { key: 'active', label: t('orders.active') },
            { key: 'completed', label: t('orders.completed') },
            { key: 'cancelled', label: t('orders.cancelled') },
            { key: 'all', label: t('orders.all') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>
        {isLoading && [0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        {!isLoading && !offers?.length && (
          <View style={{ marginTop: 60 }}>
            <EmptyState icon="send" title={t('aOffers.empty')} description={t('aOffers.emptyDesc')} />
          </View>
        )}
        {!isLoading && !!offers?.length && !shown.length && (
          <View style={{ marginTop: 60 }}>
            <EmptyState icon="send" title={t('aOffers.emptyTab')} />
          </View>
        )}
        {shown.map((o) => {
          const state = offerState(o);
          return (
            <Card
              key={o.id}
              onPress={() =>
                // Turned-down offers open their history record; the rest open the job.
                o.status === 'REJECTED'
                  ? router.push({ pathname: '/(shared)/job-history/[id]', params: { id: o.requestId, kind: 'rejected' } })
                  : router.push(`/(artisan)/job/${o.requestId}`)
              }
              style={{ gap: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                  {o.requestTitle ?? (o.categoryId ? categoryById(o.categoryId)?.name[locale] : undefined) ?? t('hist.untitled')}
                </Text>
                {/* The job's status once hired (or cancelled), else the offer's. */}
                {state.kind === 'request' ? (
                  <StatusBadge status={state.status} />
                ) : (
                  <Badge label={t(`ostatus.${state.status}` as any)} variant={STATUS_VARIANT[state.status]} />
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="wallet" size={15} color="#94A3B8" />
                  <Text variant="caption" tone="muted">
                    {formatMoney(o.price)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="clock" size={15} color="#94A3B8" />
                  <Text variant="caption" tone="muted">
                    ~{o.etaMinutes} {t('offer.min')}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                <Text variant="caption" tone="muted">
                  {timeAgo(o.createdAt)}
                </Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
