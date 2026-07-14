import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CategoryTile } from '@/components/domain/CategoryTile';
import { ServiceCard } from '@/components/domain/ServiceCard';
import { ArtisanCard } from '@/components/domain/ArtisanCard';
import { RequestCard } from '@/components/domain/RequestCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { CATEGORIES } from '@/constants/categories';
import { useServices, useRecommendedArtisans, useMyRequests } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { colors, isDark } = useTheme();
  const user = useAuth((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const services = useServices();
  const artisans = useRecommendedArtisans();
  const requests = useMyRequests(user?.uid ?? '');

  const popular = (services.data ?? []).filter((s) => s.popular).slice(0, 4);
  const recent = (requests.data ?? []).slice(0, 2);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([services.refetch(), artisans.refetch(), requests.refetch()]);
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Gradient hero header */}
      <LinearGradient colors={isDark ? ['#1E1B4B', '#0B1120'] : ['#EEF2FF', '#F8FAFC']} style={{ paddingBottom: 8 }}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={user?.photoUrl} name={user?.fullName} size={46} />
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">
                  {greeting()},
                </Text>
                <Text variant="h3" numberOfLines={1}>
                  {user?.fullName?.split(' ')[0] ?? 'there'} 👋
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(shared)/notifications')}
                style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
              >
                <Icon name="bell" size={20} color={colors.fg} />
                <View style={{ position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
              </Pressable>
            </View>
            <Pressable onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="map-pin" size={14} color={colors.tint} />
              <Text variant="caption" tone="muted">
                {user?.location?.address ?? 'Set your location'}
              </Text>
              <Icon name="chevron-down" size={14} color={colors.muted} />
            </Pressable>
            <SearchBar onPress={() => router.push('/(customer)/search')} onFilter={() => router.push('/(customer)/search')} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}>
        {/* Categories */}
        <View style={{ paddingHorizontal: 20 }}>
          <SectionHeader title="Categories" actionLabel="See all" onAction={() => router.push('/(customer)/search')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map((cat, i) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(i * 40).duration(400)}>
              <CategoryTile
                category={cat}
                locale={user?.locale ?? 'en'}
                onPress={() => router.push({ pathname: '/(customer)/search', params: { category: cat.id } })}
              />
            </Animated.View>
          ))}
        </ScrollView>

        {/* Promo banner */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <LinearGradient
            colors={['#4F46E5', '#06B6D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="h3" tone="inverse">
                Need help fast?
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Post a request and get offers in minutes.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(customer)/create')}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text variant="bodyMedium" tone="inverse">
                Request
              </Text>
              <Icon name="arrow-right" size={16} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>
        </View>

        {/* Popular services */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeader title="Popular services" actionLabel="See all" onAction={() => router.push('/(customer)/search')} />
          <View style={{ gap: 12 }}>
            {services.isLoading
              ? [0, 1, 2].map((i) => <CardSkeleton key={i} />)
              : popular.map((s) => (
                  <ServiceCard key={s.id} service={s} locale={user?.locale ?? 'en'} onPress={() => router.push(`/(shared)/service/${s.id}`)} />
                ))}
          </View>
        </View>

        {/* Recommended artisans */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeader title="Top rated artisans" actionLabel="See all" onAction={() => router.push('/(customer)/search')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {artisans.isLoading
            ? [0, 1, 2].map((i) => <View key={i} style={{ width: 160, height: 150 }}><CardSkeleton /></View>)
            : (artisans.data ?? []).map((a) => (
                <ArtisanCard key={a.uid} artisan={a} compact onPress={() => router.push(`/(shared)/artisan/${a.uid}`)} />
              ))}
        </ScrollView>

        {/* Recent requests */}
        {recent.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <SectionHeader title="Your recent requests" actionLabel="View all" onAction={() => router.push('/(customer)/requests')} />
            <View style={{ gap: 12 }}>
              {recent.map((r) => (
                <RequestCard key={r.id} request={r} onPress={() => router.push(`/(shared)/request/${r.id}`)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
