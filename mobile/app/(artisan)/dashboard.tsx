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
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RequestCard } from '@/components/domain/RequestCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useNearbyRequests } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { formatMoney } from '@/lib/format';

export default function ArtisanDashboard() {
  const { colors, isDark } = useTheme();
  const user = useAuth((s) => s.user)!;
  const [online, setOnline] = useState(true);
  const nearby = useNearbyRequests(user.uid);

  const stats = [
    { icon: 'wallet' as const, label: 'This month', value: formatMoney(1240000), color: '#6366F1' },
    { icon: 'check-circle' as const, label: 'Completed', value: '214', color: '#10B981' },
    { icon: 'star' as const, label: 'Rating', value: '4.8', color: '#F59E0B' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient colors={isDark ? ['#1E1B4B', '#0B1120'] : ['#EEF2FF', '#F8FAFC']} style={{ paddingBottom: 8 }}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={user.photoUrl} name={user.fullName} size={46} verified={user.verified} />
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">
                  Welcome back,
                </Text>
                <Text variant="h3" numberOfLines={1}>
                  {user.fullName.split(' ')[0]}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(shared)/notifications')} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                <Icon name="bell" size={20} color={colors.fg} />
              </Pressable>
            </View>

            {/* Availability toggle */}
            <Pressable onPress={() => setOnline((o) => !o)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: (online ? '#10B981' : '#94A3B8') + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={online ? 'zap' : 'moon'} size={22} color={online ? '#10B981' : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{online ? 'You are online' : 'You are offline'}</Text>
                  <Text variant="caption" tone="muted">
                    {online ? 'Receiving nearby requests' : 'Tap to start receiving requests'}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}>
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
          <SectionHeader title="Nearby requests" actionLabel="View all" onAction={() => router.push('/(artisan)/requests')} />
          <View style={{ gap: 12 }}>
            {nearby.isLoading ? (
              [0, 1].map((i) => <CardSkeleton key={i} />)
            ) : (
              (nearby.data ?? []).slice(0, 3).map((r) => (
                <RequestCard key={r.id} request={r} onPress={() => router.push(`/(artisan)/job/${r.id}`)} />
              ))
            )}
          </View>
        </View>

        {/* Subscription CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <LinearGradient colors={['#F59E0B', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Icon name="award" size={32} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" tone="inverse">
                Go Premium
              </Text>
              <Text variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Get more visibility & priority matching.
              </Text>
            </View>
            <Badge label="Upgrade" variant="warning" />
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}
