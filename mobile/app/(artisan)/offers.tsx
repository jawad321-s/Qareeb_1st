import React from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatMoney, timeAgo } from '@/lib/format';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { categoryById } from '@/constants/categories';
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
  const { data: offers, isLoading } = useArtisanOffers(uid);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text variant="h1">{t('aOffers.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>
        {isLoading && [0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        {!isLoading && !offers?.length && (
          <View style={{ marginTop: 60 }}>
            <EmptyState icon="send" title={t('aOffers.empty')} description={t('aOffers.emptyDesc')} />
          </View>
        )}
        {offers?.map((o) => (
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
              <Badge label={t(`ostatus.${o.status}` as any)} variant={STATUS_VARIANT[o.status]} />
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
        ))}
      </ScrollView>
    </Screen>
  );
}
