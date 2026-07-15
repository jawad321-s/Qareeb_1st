import React from 'react';
import { View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ArtisanCard } from '@/components/domain/ArtisanCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useService, useRecommendedArtisans } from '@/hooks/queries';
import { categoryById } from '@/constants/categories';
import { formatMoney } from '@/lib/format';
import { useT } from '@/i18n';

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: service, isLoading } = useService(id!);
  const artisans = useRecommendedArtisans();
  const { t, locale } = useT();

  const HIGHLIGHTS = [
    { icon: 'shield', title: t('sd.verifiedPros'), desc: t('sd.verifiedProsDesc') },
    { icon: 'clock', title: t('sd.fastResponse'), desc: t('sd.fastResponseDesc') },
    { icon: 'award', title: t('sd.quality'), desc: t('sd.qualityDesc') },
  ] as const;

  if (isLoading || !service) {
    return (
      <Screen scroll>
        <Header showBack />
        <CardSkeleton />
      </Screen>
    );
  }

  const cat = categoryById(service.categoryId);
  const color = cat?.colorHex ?? '#3B82F6';

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll padded={false}>
        <View style={{ paddingHorizontal: 20 }}>
          <Header showBack rightIcon="heart" />
        </View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20 }}>
          <LinearGradient colors={[color, color + 'AA']} style={{ borderRadius: 24, padding: 24, gap: 12 }}>
            <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={service.icon as any} size={30} color="#FFF" />
            </View>
            <Text variant="h1" tone="inverse">
              {service.name[locale]}
            </Text>
            <Text variant="body" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {service.description[locale]}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {t('sd.startingFrom')}
              </Text>
              <Text variant="h3" tone="inverse">
                {formatMoney(service.basePriceFrom)}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Highlights */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20 }}>
          {HIGHLIGHTS.map((h) => (
            <Card key={h.title} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16 }}>
              <Icon name={h.icon} size={22} color={color} />
              <Text variant="caption" center style={{ fontFamily: 'Inter_600SemiBold' }}>
                {h.title}
              </Text>
              <Text variant="overline" tone="muted" center>
                {h.desc}
              </Text>
            </Card>
          ))}
        </View>

        {/* Available artisans */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text variant="h3" style={{ marginBottom: 12 }}>
            {t('sd.available')}
          </Text>
          <View style={{ gap: 12 }}>
            {artisans.isLoading
              ? [0, 1, 2].map((i) => <CardSkeleton key={i} />)
              : (artisans.data ?? []).slice(0, 4).map((a) => (
                  <ArtisanCard key={a.uid} artisan={a} subtitle={cat?.name[locale]} distanceKm={2.4} onPress={() => router.push(`/(shared)/artisan/${a.uid}`)} />
                ))}
          </View>
        </View>
      </Screen>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32 }}>
        <Button label={t('sd.request')} iconRight="arrow-right" onPress={() => router.push({ pathname: '/(customer)/create', params: { category: service.categoryId } })} />
      </View>
    </View>
  );
}
