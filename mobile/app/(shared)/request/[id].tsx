import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { TrackingTimeline } from '@/components/domain/TrackingTimeline';
import { OfferCard } from '@/components/domain/OfferCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useRequest, useOffers, useAcceptOffer, useRejectOffer } from '@/hooks/queries';
import { categoryById } from '@/constants/categories';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { MOCK_ARTISANS } from '@/mock/data';

export default function RequestDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: request, isLoading } = useRequest(id!);
  const offers = useOffers(id!);
  const accept = useAcceptOffer(id!);
  const reject = useRejectOffer(id!);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  if (isLoading || !request) {
    return (
      <Screen scroll>
        <Header showBack title="Request" />
        <View style={{ gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </Screen>
    );
  }

  const cat = categoryById(request.categoryId);
  const isPending = request.status === 'PENDING';
  const acceptedArtisan = MOCK_ARTISANS.find((a) => a.uid === request.acceptedArtisanId);
  const bestPrice = Math.min(...(offers.data ?? []).map((o) => o.price));

  const onAccept = async (offerId: string) => {
    setAcceptingId(offerId);
    await accept.mutateAsync(offerId);
    setAcceptingId(null);
  };

  return (
    <Screen scroll>
      <Header showBack title="Request details" rightIcon="more-horizontal" />

      <Animated.View entering={FadeInDown.duration(400)}>
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: (cat?.colorHex ?? '#6366F1') + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={(cat?.icon as any) ?? 'tools'} size={22} color={cat?.colorHex ?? '#6366F1'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3" numberOfLines={1}>
                  {request.title}
                </Text>
                <Text variant="caption" tone="muted">
                  {cat?.name.en}
                </Text>
              </View>
            </View>
            <StatusBadge status={request.status} />
          </View>
          <Text variant="body" tone="muted" style={{ lineHeight: 21 }}>
            {request.description}
          </Text>
          {request.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {request.images.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: 120, height: 120, borderRadius: 14 }} />
              ))}
            </ScrollView>
          )}
          <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
            <Info icon="wallet" label={`${formatMoney(request.budget.min)}–${formatMoney(request.budget.max)}`} />
            <Info icon="map-pin" label={request.location.address} />
          </View>
        </Card>
      </Animated.View>

      {/* Tracking (non-pending) */}
      {!isPending && (
        <View style={{ marginTop: 20 }}>
          <Text variant="h3" style={{ marginBottom: 14 }}>
            Order tracking
          </Text>
          <Card>
            <TrackingTimeline status={request.status} />
          </Card>
        </View>
      )}

      {/* Accepted artisan card */}
      {acceptedArtisan && (
        <View style={{ marginTop: 20 }}>
          <Text variant="h3" style={{ marginBottom: 14 }}>
            Your artisan
          </Text>
          <Card style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={acceptedArtisan.photoUrl} name={acceptedArtisan.fullName} size={52} verified={acceptedArtisan.verified} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{acceptedArtisan.fullName}</Text>
                <Rating value={acceptedArtisan.rating} count={acceptedArtisan.ratingCount} size={13} showValue />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="Chat" iconLeft="message" variant="secondary" onPress={() => router.push(`/(shared)/chat/${request.id}`)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Call" iconLeft="phone" onPress={() => {}} />
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Offers (pending) */}
      {isPending && (
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text variant="h3">Offers ({offers.data?.length ?? 0})</Text>
            <Text variant="caption" tone="muted">
              Sorted by price
            </Text>
          </View>
          <View style={{ gap: 18 }}>
            {offers.isLoading ? (
              [0, 1].map((i) => <CardSkeleton key={i} />)
            ) : (
              (offers.data ?? []).map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  best={o.price === bestPrice}
                  loading={acceptingId === o.id}
                  onAccept={() => onAccept(o.id)}
                  onReject={() => reject.mutate(o.id)}
                  onPressArtisan={() => router.push(`/(shared)/artisan/${o.artisanId}`)}
                />
              ))
            )}
          </View>
        </View>
      )}

      {/* Completed → review CTA */}
      {request.status === 'COMPLETED' && (
        <View style={{ marginTop: 20 }}>
          <Button label="Rate your experience" iconLeft="star" onPress={() => router.push(`/(shared)/review/${request.id}`)} />
        </View>
      )}
    </Screen>
  );
}

function Info({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={16} color="#94A3B8" />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}
