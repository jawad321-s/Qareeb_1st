import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { ArtisanCard } from '@/components/domain/ArtisanCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useRecommendedArtisans } from '@/hooks/queries';
import { useT } from '@/i18n';

export default function Favorites() {
  const { data, isLoading } = useRecommendedArtisans();
  const { t } = useT();
  const favorites = (data ?? []).filter((a) => a.verified).slice(0, 3);

  return (
    <Screen scroll>
      <Header showBack title={t('fav.title')} />
      {isLoading ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : favorites.length === 0 ? (
        <View style={{ marginTop: 60 }}>
          <EmptyState icon="heart" title={t('fav.empty')} description={t('fav.emptyDesc')} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {favorites.map((a) => (
            <ArtisanCard key={a.uid} artisan={a} subtitle={t('fav.saved')} onPress={() => router.push(`/(shared)/artisan/${a.uid}`)} />
          ))}
        </View>
      )}
    </Screen>
  );
}
