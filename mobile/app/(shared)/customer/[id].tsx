import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useReviews, useUser } from '@/hooks/queries';
import { config } from '@/lib/config';
import { formatDate, timeAgo } from '@/lib/format';
import { ratingSummary, ratingValue } from '@/lib/rating';
import { useT } from '@/i18n';

/** A customer as artisans see them: who they are and how other artisans rated them. */
export default function CustomerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { data: user, isLoading } = useUser(id);
  const reviews = useReviews(id!);

  if (isLoading || !user) {
    return (
      <Screen>
        <Header showBack title={t('cust.title')} />
        <CardSkeleton />
      </Screen>
    );
  }

  // The rating from the reviews themselves (the stored figure is a cache).
  const rating = !config.useMock && reviews.data ? ratingSummary(reviews.data) : { average: user.rating, count: user.ratingCount };

  return (
    <Screen scroll>
      <Header showBack title={t('cust.title')} />
      <View style={{ alignItems: 'center', gap: 6, marginTop: 8 }}>
        <Avatar uri={user.photoUrl} name={user.fullName} size={88} />
        <Text variant="h2">{user.fullName}</Text>
        {!!user.createdAt && (
          <Text variant="caption" tone="muted">
            {t('cust.since')} {formatDate(user.createdAt)}
          </Text>
        )}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text variant="h3">{ratingValue(rating)}</Text>
          <Text variant="caption" tone="muted">
            {t('profile.rating')}
          </Text>
        </View>
      </View>

      <Text variant="h3" style={{ marginTop: 24, marginBottom: 12 }}>
        {t('cust.reviews')}
      </Text>
      {reviews.data?.length ? (
        <View style={{ gap: 12 }}>
          {reviews.data.map((r) => (
            <Card key={r.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Rating value={r.rating} size={13} />
                <Text variant="caption" tone="muted">
                  {timeAgo(r.createdAt)}
                </Text>
              </View>
              {!!r.comment && (
                <Text variant="body" tone="muted">
                  {r.comment}
                </Text>
              )}
            </Card>
          ))}
        </View>
      ) : (
        <Text variant="body" tone="muted">
          {t('cust.noReviews')}
        </Text>
      )}
    </Screen>
  );
}
