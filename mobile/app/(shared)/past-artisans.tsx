import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { ArtisanCard } from '@/components/domain/ArtisanCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useUser } from '@/hooks/queries';
import { usePastArtisans } from '@/hooks/usePastArtisans';
import type { PastArtisan } from '@/lib/pastArtisans';
import { timeAgo } from '@/lib/format';
import { useT } from '@/i18n';

/** The artisans this customer has worked with, most recent first. */
export default function PastArtisans() {
  const { t } = useT();
  const { list, isLoading } = usePastArtisans();

  return (
    <Screen scroll>
      <Header showBack title={t('past.title')} subtitle={list.length ? t('past.subtitle') : undefined} />
      {isLoading ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : list.length === 0 ? (
        <View style={{ marginTop: 60 }}>
          <EmptyState icon="briefcase" title={t('past.empty')} description={t('past.emptyDesc')} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((p) => (
            <Row key={p.artisanId} past={p} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Row({ past }: { past: PastArtisan }) {
  const { t } = useT();
  const { data: artisan, isLoading } = useUser(past.artisanId);
  if (isLoading) return <CardSkeleton />;
  // An account that no longer exists is left out.
  if (!artisan) return null;
  return (
    <ArtisanCard
      artisan={artisan}
      subtitle={t('past.last').replace('{title}', past.lastTitle)}
      detail={`${t('past.jobs').replace('{n}', String(past.jobs))} · ${timeAgo(past.lastAt)}`}
      onPress={() => router.push(`/(shared)/artisan/${past.artisanId}`)}
    />
  );
}
