import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { FloatingBlobs } from '@/components/ui/FloatingBlobs';
import { useArtisan, useReviews } from '@/hooks/queries';
import { usePastArtisans } from '@/hooks/usePastArtisans';
import { categoryById } from '@/constants/categories';
import { config } from '@/lib/config';
import { timeAgo } from '@/lib/format';
import { ratingSummary, ratingValue } from '@/lib/rating';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

export default function ArtisanDetail() {
  const { colors, isDark, gradient, gradientSoft } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useT();
  const { data, isLoading } = useArtisan(id!);
  const reviews = useReviews(id!);
  // Set when the signed-in customer has worked with this artisan before.
  const past = usePastArtisans().byId.get(id!);

  if (isLoading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: 20, gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  const { user, profile } = data;
  // The rating from the reviews themselves (the stored figure is a cache). Only
  // the overall figure is shown, not the individual reviews.
  const rating = !config.useMock && reviews.data ? ratingSummary(reviews.data) : { average: user.rating, count: user.ratingCount };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={isDark ? [gradient[0], '#0A0F1E'] : [gradient[0], gradient[2]]} style={{ paddingBottom: 24, overflow: 'hidden' }}>
          <FloatingBlobs
            blobs={[
              { size: 190, colors: [gradientSoft[1], gradientSoft[0]], top: -60, right: -40, range: 24 },
              { size: 140, colors: [gradientSoft[0], gradientSoft[1]], bottom: -30, left: -30, delay: 1400, range: 18 },
            ]}
          />
          <SafeAreaView edges={['top']}>
            <View style={{ paddingHorizontal: 20 }}>
              <Header showBack transparent />
            </View>
            <View style={{ alignItems: 'center', gap: 8, paddingTop: 8 }}>
              <Avatar uri={user.photoUrl} name={user.fullName} size={96} verified={user.verified} />
              <Text variant="h2" tone="inverse">
                {user.fullName}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {profile.premium && <Badge label={t('ad.premium')} variant="warning" icon="award" />}
                {user.verified && <Badge label={t('ad.verified')} variant="success" icon="shield" />}
              </View>
              <View style={{ flexDirection: 'row', gap: 28, marginTop: 12 }}>
                <Stat value={ratingValue(rating)} label={t('profile.rating')} />
                <Stat value={String(profile.completedJobs ?? 0)} label={t('ad.jobs')} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 20 }}>
          {past && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <Pressable
                onPress={() => router.push(`/(shared)/request/${past.lastRequestId}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: '#10B98114', borderWidth: 1, borderColor: '#10B98140' }}
              >
                <Icon name="check-circle" size={22} color="#10B981" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyMedium">{t('past.cardTitle')}</Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {t('past.last').replace('{title}', past.lastTitle)}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {t('past.jobs').replace('{n}', String(past.jobs))} · {timeAgo(past.lastAt)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.duration(400)}>
            <Text variant="h3" style={{ marginBottom: 8 }}>
              {t('ad.about')}
            </Text>
            <Text variant="body" tone="muted" style={{ lineHeight: 22 }}>
              {profile.bio}
            </Text>
          </Animated.View>

          {/* Categories */}
          <View>
            <Text variant="h3" style={{ marginBottom: 10 }}>
              {t('ad.services')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {profile.categoryIds.map((cid) => {
                const c = categoryById(cid);
                return c ? <Badge key={cid} label={c.name[locale]} variant="primary" icon={c.icon as any} /> : null;
              })}
            </View>
          </View>

          {/* Gallery — a profile written before galleries existed has none. */}
          {(profile.gallery ?? []).length > 0 && (
            <View>
              <Text variant="h3" style={{ marginBottom: 10 }}>
                {t('ad.gallery')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {(profile.gallery ?? []).map((uri) => (
                  <Image key={uri} source={{ uri }} style={{ width: 160, height: 120, borderRadius: 16 }} contentFit="cover" />
                ))}
              </ScrollView>
            </View>
          )}

        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button label={t('ad.request')} iconRight="arrow-right" onPress={() => router.push('/(customer)/create')} />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="h3" tone="inverse">
        {value}
      </Text>
      <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </Text>
    </View>
  );
}
