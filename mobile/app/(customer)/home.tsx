import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CategoryTile } from '@/components/domain/CategoryTile';
import { RequestCard } from '@/components/domain/RequestCard';
import { CATEGORIES } from '@/constants/categories';
import { useConversations, useMyRequests } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

export default function Home() {
  const { colors, isDark } = useTheme();
  const tabBarSpace = useTabBarSpace();
  const user = useAuth((s) => s.user);
  const { t, locale } = useT();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home.morning');
    if (h < 18) return t('home.afternoon');
    return t('home.evening');
  };

  const requests = useMyRequests(user?.uid ?? '');
  const conversations = useConversations(user);

  const recent = (requests.data ?? []).slice(0, 2);
  const unread = (conversations.data ?? []).filter(
    (c) => c.lastMessage && !c.lastMessage.read && c.lastMessage.senderId !== user?.uid,
  ).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Gradient hero header */}
      <LinearGradient colors={isDark ? ['#141F3C', '#0A0F1E'] : ['#E9EFFB', '#F6F8FB']} style={{ paddingBottom: 10 }}>
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 10, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={user?.photoUrl} name={user?.fullName} size={46} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="caption" tone="muted">
                  {greeting()}
                </Text>
                <Text variant="h3" numberOfLines={1}>
                  {user?.fullName ?? ''}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(shared)/notifications')}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
              >
                <Icon name="bell" size={19} color={colors.fg} />
                <View style={{ position: 'absolute', top: 9, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: colors.surface }} />
              </Pressable>
            </View>
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
                {user?.location?.address ?? t('home.setLocation')}
              </Text>
              <Icon name="chevron-down" size={13} color={colors.muted} />
            </Pressable>
            {/* Messages — takes the place of the old search box. */}
            <Pressable
              onPress={() => router.push('/(customer)/messages')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                height: 56,
                paddingHorizontal: 16,
                borderRadius: 18,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Icon name="message" size={20} color={colors.tint} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{t('home.messages')}</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {conversations.data?.length ? `${conversations.data.length} ${t('home.chats')}` : t('home.messagesHint')}
                </Text>
              </View>
              {unread > 0 && (
                <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text variant="caption" style={{ color: '#FFF', fontFamily: 'Inter_600SemiBold' }}>
                    {unread}
                  </Text>
                </View>
              )}
              <Icon name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarSpace + 16, paddingTop: 20 }}>
        {/* Categories */}
        <View style={{ paddingHorizontal: 20 }}>
          <SectionHeader title={t('home.categories')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIES.map((cat, i) => (
            <Animated.View key={cat.id} entering={FadeInDown.delay(i * 40).duration(400)}>
              <CategoryTile
                category={cat}
                locale={locale}
                // Picking a category starts a request for it.
                onPress={() => router.push({ pathname: '/(customer)/create', params: { category: cat.id } })}
              />
            </Animated.View>
          ))}
        </ScrollView>

        {/* Promo banner — layered gradient with decorative geometry and a
            high-contrast white CTA (banner owns the color, button owns focus). */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <LinearGradient
            colors={['#1E40AF', '#2563EB', '#0891D1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.1, y: 1.2 }}
            style={{ borderRadius: 24, padding: 20, overflow: 'hidden' }}
          >
            <View style={{ position: 'absolute', top: -46, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ position: 'absolute', bottom: -60, right: 60, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text variant="h3" tone="inverse">
                  {t('home.promoTitle')}
                </Text>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 18 }}>
                  {t('home.promoDesc')}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(customer)/create')}
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold', color: '#1D4ED8' }}>
                  {t('tab.request')}
                </Text>
                <Icon name="arrow-right" size={14} color="#1D4ED8" />
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Recent requests */}
        {recent.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <SectionHeader title={t('home.recent')} actionLabel={t('common.viewAll')} onAction={() => router.push('/(customer)/requests')} />
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
