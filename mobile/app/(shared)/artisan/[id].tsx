import React from 'react';
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { FloatingBlobs } from '@/components/ui/FloatingBlobs';
import { useArtisan, useReviews } from '@/hooks/queries';
import { categoryById } from '@/constants/categories';
import { timeAgo } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

export default function ArtisanDetail() {
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useT();
  const { data, isLoading } = useArtisan(id!);
  const reviews = useReviews(id!);

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={isDark ? ['#172554', '#0B1120'] : ['#2563EB', '#0EA5E9']} style={{ paddingBottom: 24, overflow: 'hidden' }}>
          <FloatingBlobs
            blobs={[
              { size: 190, colors: ['#60A5FA', '#2563EB'], top: -60, right: -40, range: 24 },
              { size: 140, colors: ['#38BDF8', '#0EA5E9'], bottom: -30, left: -30, delay: 1400, range: 18 },
            ]}
          />
          <SafeAreaView edges={['top']}>
            <View style={{ paddingHorizontal: 20 }}>
              <Header showBack rightIcon="heart" transparent />
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
                <Stat value={user.rating.toFixed(1)} label={t('profile.rating')} />
                <Stat value={String(profile.completedJobs)} label={t('ad.jobs')} />
                <Stat value={`${profile.serviceRadiusKm}km`} label={t('ad.radius')} />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 20, gap: 20 }}>
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

          {/* Gallery */}
          {profile.gallery.length > 0 && (
            <View>
              <Text variant="h3" style={{ marginBottom: 10 }}>
                {t('ad.gallery')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {profile.gallery.map((uri) => (
                  <Image key={uri} source={{ uri }} style={{ width: 160, height: 120, borderRadius: 16 }} contentFit="cover" />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Reviews */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text variant="h3">{t('ad.reviews')}</Text>
              <Rating value={user.rating} count={user.ratingCount} size={14} showValue />
            </View>
            <View style={{ gap: 12 }}>
              {(reviews.data ?? []).map((r) => (
                <Card key={r.id} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Rating value={r.rating} size={13} />
                    <Text variant="caption" tone="muted">
                      {timeAgo(r.createdAt)}
                    </Text>
                  </View>
                  <Text variant="body" tone="muted">
                    {r.comment}
                  </Text>
                </Card>
              ))}
            </View>
          </View>
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
