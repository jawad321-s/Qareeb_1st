import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { ArtisanCard } from '@/components/domain/ArtisanCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useRecommendedArtisans } from '@/hooks/queries';

export default function Favorites() {
  const { data, isLoading } = useRecommendedArtisans();
  const favorites = (data ?? []).filter((a) => a.verified).slice(0, 3);

  return (
    <Screen scroll>
      <Header showBack title="Favorites" />
      {isLoading ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : favorites.length === 0 ? (
        <View style={{ marginTop: 60 }}>
          <EmptyState icon="heart" title="No favorites yet" description="Tap the heart on an artisan to save them here." />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {favorites.map((a) => (
            <ArtisanCard key={a.uid} artisan={a} subtitle="Saved artisan" onPress={() => router.push(`/(shared)/artisan/${a.uid}`)} />
          ))}
        </View>
      )}
    </Screen>
  );
}
