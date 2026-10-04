import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { RequestCard } from '@/components/domain/RequestCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useNearbyRequests } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { daysLabel, planById } from '@/lib/plans';
import { useMySubscription } from '@/store/subscription';
import { storage } from '@/lib/mmkv';

export default function ArtisanDashboard() {
  const { colors, isDark, hero } = useTheme();
  const user = useAuth((s) => s.user)!;
  const { t, locale } = useT();
  const [online, setOnline] = useState(true);
  const subscription = useMySubscription(user.uid);
  const currentPlan = subscription.isActive && subscription.record ? planById(subscription.record.planId) : undefined;
  const nearby = useNearbyRequests(user.uid, user.location);
  const tabBarSpace = useTabBarSpace();

  // Artisans are matched to jobs by distance, so ask for the device location
  // the first time the app opens (once per account; the chip below re-opens it).
  useEffect(() => {
    const key = `qareeb.locationAsked.${user.uid}`;
    if (storage.getString(key)) return;
    // Marked only when the prompt actually opens — if the screen goes away
    // first (e.g. the mandatory rating takes over), it is asked next time.
    const id = setTimeout(() => {
      storage.set(key, '1');
      router.push('/(shared)/location-permission');
    }, 600);
    return () => clearTimeout(id);
  }, [user.uid]);

  const stats = [
    { icon: 'wallet' as const, label: t('artisan.thisMonth'), value: formatMoney(1240000), color: colors.tint },
    { icon: 'check-circle' as const, label: t('artisan.completed'), value: '214', color: '#10B981' },
    { icon: 'star' as const, label: t('profile.rating'), value: '4.8', color: '#F59E0B' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient colors={hero} style={{ paddingBottom: 8 }}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={user.photoUrl} name={user.fullName} size={46} verified={user.verified} />
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">
                  {t('artisan.welcome')}
                </Text>
                <Text variant="h3" numberOfLines={1}>
                  {user.fullName.split(' ')[0]}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(shared)/notifications')} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Icon name="bell" size={20} color={colors.fg} />
              </Pressable>
            </View>

            {/* Where the artisan works from — distances to jobs are measured from here. */}
            <Pressable
              onPress={() => router.push('/(shared)/location-permission')}
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icon name="map-pin" size={13} color={colors.tint} />
              <Text variant="caption" style={{ fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
                {user.location?.address ?? t('home.setLocation')}
              </Text>
              <Icon name="chevron-down" size={13} color={colors.muted} />
            </Pressable>

            {/* Availability toggle */}
            <Pressable onPress={() => setOnline((o) => !o)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: (online ? '#10B981' : '#94A3B8') + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={online ? 'zap' : 'moon'} size={22} color={online ? '#10B981' : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{online ? t('artisan.online') : t('artisan.offline')}</Text>
                  <Text variant="caption" tone="muted">
                    {online ? t('artisan.onlineDesc') : t('artisan.offlineDesc')}
                  </Text>
                </View>
                <View style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: online ? '#10B981' : colors.border, padding: 3, justifyContent: 'center' }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', alignSelf: online ? 'flex-end' : 'flex-start' }} />
                </View>
              </Card>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarSpace + 16, paddingTop: 16 }}>
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
          {stats.map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(i * 80).duration(400)} style={{ flex: 1 }}>
              <Card style={{ gap: 8, paddingVertical: 16 }}>
                <Icon name={s.icon} size={20} color={s.color} />
                <Text variant="h3">{s.value}</Text>
                <Text variant="overline" tone="muted">
                  {s.label}
                </Text>
              </Card>
            </Animated.View>
          ))}
        </View>

        {/* Nearby requests */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeader title={t('artisan.nearby')} actionLabel={t('common.viewAll')} onAction={() => router.push('/(artisan)/requests')} />
          <View style={{ gap: 12 }}>
            {nearby.isLoading ? (
              [0, 1].map((i) => <CardSkeleton key={i} />)
            ) : (
              (nearby.data ?? []).slice(0, 3).map((r) => (
                <RequestCard key={r.id} request={r} distanceKm={r.distanceKm} onPress={() => router.push(`/(artisan)/job/${r.id}`)} />
              ))
            )}
          </View>
        </View>

        {/* Subscription status: trial days left, the paid plan, or — once it has
            ended — a prompt to subscribe. Opens the plans screen. */}
        <Pressable onPress={() => router.push('/(shared)/subscription')} style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <LinearGradient
            colors={currentPlan ? ['#F59E0B', '#EF4444'] : ['#DC2626', '#B91C1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <Icon name={currentPlan ? 'award' : 'alert-circle'} size={32} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" tone="inverse">
                {currentPlan ? `${t('sub.yourPlan')}: ${currentPlan.name[locale]}` : t('sub.expired')}
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {currentPlan
                  ? `${daysLabel(subscription.daysLeft, locale)} ${t('sub.left')}`
                  : t('sub.needPlanTitle')}
              </Text>
            </View>
            {currentPlan ? <Badge label="✓" variant="success" /> : <Icon name="chevron-right" size={22} color="#FFF" />}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}
