import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useReviews, useUser } from '@/hooks/queries';
import { config } from '@/lib/config';
import { formatDate } from '@/lib/format';
import { ratingSummary, ratingValue } from '@/lib/rating';
import { useT } from '@/i18n';

/** A customer as artisans see them: who they are and their overall rating from artisans. */
export default function CustomerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();
  const { data: user, isLoading } = useUser(id);
  const reviews = useReviews(id!);

  if (isLoading || !user) {
    return (
      <Screen>
        <Header showBack title={t('cust.title')} />
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <Text variant="body" tone="muted">
            {t('cust.notYet')}
          </Text>
        )}
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
        <View style={{ alignItems: 'center', gap: 4, marginTop: 12 }}>
          <Rating value={rating.count ? rating.average : 0} size={20} />
          <Text variant="h3">{ratingValue(rating)}</Text>
          <Text variant="caption" tone="muted">
            {t('profile.rating')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
