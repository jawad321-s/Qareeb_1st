import React from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatMoney, timeAgo } from '@/lib/format';
import { MOCK_OFFERS, MOCK_REQUESTS } from '@/mock/data';
import type { OfferStatus } from '@/types';

const STATUS_VARIANT: Record<OfferStatus, React.ComponentProps<typeof Badge>['variant']> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

export default function ArtisanOffers() {
  // Present the current artisan's submitted offers with their request context.
  const offers = MOCK_OFFERS.map((o) => ({ ...o, request: MOCK_REQUESTS.find((r) => r.id === o.requestId) }));

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text variant="h1">My offers</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>
        {offers.map((o) => (
          <Card key={o.id} onPress={() => o.request && router.push(`/(artisan)/job/${o.request.id}`)} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                {o.request?.title ?? 'Request'}
              </Text>
              <Badge label={o.status} variant={STATUS_VARIANT[o.status]} />
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
                  ~{o.etaMinutes} min
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
