import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { EmptyState } from '@/components/feedback/EmptyState';
import { timeAgo } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

const NOTIFS: { id: string; icon: IconName; color: string; title: string; body: string; ts: number; read: boolean; route?: string }[] = [
  { id: 'n1', icon: 'wallet', color: '#6366F1', title: 'New offer received', body: 'Omar Khalid offered 120 SAR for your plumbing request.', ts: Date.now() - 12 * 60_000, read: false, route: '/(shared)/request/req_1' },
  { id: 'n2', icon: 'check-circle', color: '#10B981', title: 'Offer accepted', body: 'Your AC repair is confirmed with Tariq Mansour.', ts: Date.now() - 2 * 3600_000, read: false, route: '/(shared)/request/req_2' },
  { id: 'n3', icon: 'message', color: '#06B6D4', title: 'New message', body: 'Tariq: Please keep the AC off until I arrive.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
  { id: 'n4', icon: 'star', color: '#F59E0B', title: 'Rate your artisan', body: 'How was your deep-clean service? Leave a review.', ts: Date.now() - 4 * 24 * 3600_000, read: true, route: '/(shared)/request/req_3' },
];

export default function Notifications() {
  const { colors } = useTheme();

  return (
    <Screen scroll>
      <Header showBack title="Notifications" rightIcon="check-circle" />
      {NOTIFS.length === 0 ? (
        <View style={{ marginTop: 60 }}>
          <EmptyState icon="bell" title="No notifications" description="You're all caught up! New updates will appear here." />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {NOTIFS.map((n, i) => (
            <Animated.View key={n.id} entering={FadeInDown.delay(i * 60).duration(400)}>
              <Card onPress={n.route ? () => router.push(n.route as any) : undefined} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: n.read ? undefined : colors.tint + '0C' }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: n.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={n.icon} size={20} color={n.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                      {n.title}
                    </Text>
                    {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.tint }} />}
                  </View>
                  <Text variant="caption" tone="muted" style={{ lineHeight: 18 }}>
                    {n.body}
                  </Text>
                  <Text variant="overline" tone="muted" style={{ marginTop: 2 }}>
                    {timeAgo(n.ts)}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}
