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
import { useT } from '@/i18n';

type Notif = { id: string; icon: IconName; color: string; title: string; body: string; ts: number; read: boolean; route?: string };

// Role-specific feeds: customers get updates about THEIR requests (offers in,
// booking confirmed, review prompt); artisans get updates about THEIR work
// (nearby jobs, offer accepted, new rating, weekly income).
const customerNotifs = (tint: string): Record<'en' | 'ar', Notif[]> => ({
  en: [
    { id: 'c1', icon: 'wallet', color: tint, title: 'New offer received', body: 'Omar Khalid offered 120 ₪ for your plumbing request.', ts: Date.now() - 12 * 60_000, read: false, route: '/(shared)/request/req_1' },
    { id: 'c2', icon: 'check-circle', color: '#10B981', title: 'Offer accepted', body: 'Your AC repair is confirmed with Tariq Mansour.', ts: Date.now() - 2 * 3600_000, read: false, route: '/(shared)/request/req_2' },
    { id: 'c3', icon: 'message', color: tint, title: 'New message', body: 'Tariq: Please keep the AC off until I arrive.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'c4', icon: 'star', color: '#F59E0B', title: 'Rate your artisan', body: 'How was your deep-clean service? Leave a review.', ts: Date.now() - 4 * 24 * 3600_000, read: true, route: '/(shared)/request/req_3' },
  ],
  ar: [
    { id: 'c1', icon: 'wallet', color: tint, title: 'عرض جديد', body: 'قدّم عمر خالد عرضاً بـ 120 ₪ لطلب السباكة.', ts: Date.now() - 12 * 60_000, read: false, route: '/(shared)/request/req_1' },
    { id: 'c2', icon: 'check-circle', color: '#10B981', title: 'تم قبول العرض', body: 'تم تأكيد إصلاح التكييف مع طارق منصور.', ts: Date.now() - 2 * 3600_000, read: false, route: '/(shared)/request/req_2' },
    { id: 'c3', icon: 'message', color: tint, title: 'رسالة جديدة', body: 'طارق: من فضلك أبقِ التكييف مطفأً حتى أصل.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'c4', icon: 'star', color: '#F59E0B', title: 'قيّم الحرفي', body: 'كيف كانت خدمة التنظيف؟ اترك تقييماً.', ts: Date.now() - 4 * 24 * 3600_000, read: true, route: '/(shared)/request/req_3' },
  ],
});

const artisanNotifs = (tint: string): Record<'en' | 'ar', Notif[]> => ({
  en: [
    { id: 'a1', icon: 'briefcase', color: tint, title: 'New job near you', body: 'Kitchen sink leak in Al-Masyoun, 2.4 km away — budget 80–200 ₪.', ts: Date.now() - 8 * 60_000, read: false, route: '/(artisan)/job/req_1' },
    { id: 'a2', icon: 'check-circle', color: '#10B981', title: 'Your offer was accepted', body: 'Layla Khaled accepted your 150 ₪ offer for the AC repair.', ts: Date.now() - 90 * 60_000, read: false, route: '/(artisan)/job/req_2' },
    { id: 'a3', icon: 'message', color: tint, title: 'New message from customer', body: 'Layla: The building entrance code is 4512.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'a4', icon: 'star', color: '#F59E0B', title: 'New 5-star review', body: '"Fast and clean work, highly recommended" — Ahmad S.', ts: Date.now() - 26 * 3600_000, read: true },
    { id: 'a5', icon: 'trending-up', color: '#10B981', title: 'Weekly income summary', body: 'You earned 940 ₪ from 6 completed jobs this week.', ts: Date.now() - 3 * 24 * 3600_000, read: true, route: '/(artisan)/income' },
  ],
  ar: [
    { id: 'a1', icon: 'briefcase', color: tint, title: 'عمل جديد قريب منك', body: 'تسريب في مغسلة المطبخ بالماصيون، يبعد 2.4 كم — الميزانية 80–200 ₪.', ts: Date.now() - 8 * 60_000, read: false, route: '/(artisan)/job/req_1' },
    { id: 'a2', icon: 'check-circle', color: '#10B981', title: 'تم قبول عرضك', body: 'قبلت ليلى خالد عرضك 150 ₪ لإصلاح التكييف.', ts: Date.now() - 90 * 60_000, read: false, route: '/(artisan)/job/req_2' },
    { id: 'a3', icon: 'message', color: tint, title: 'رسالة جديدة من الزبون', body: 'ليلى: رمز مدخل البناية 4512.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'a4', icon: 'star', color: '#F59E0B', title: 'تقييم جديد 5 نجوم', body: '"شغل سريع ونظيف، أنصح فيه" — أحمد س.', ts: Date.now() - 26 * 3600_000, read: true },
    { id: 'a5', icon: 'trending-up', color: '#10B981', title: 'ملخص دخل الأسبوع', body: 'حقّقت 940 ₪ من 6 أعمال مكتملة هذا الأسبوع.', ts: Date.now() - 3 * 24 * 3600_000, read: true, route: '/(artisan)/income' },
  ],
});

export default function Notifications() {
  const { colors, role } = useTheme();
  const { t, locale } = useT();
  const notifs = (role === 'artisan' ? artisanNotifs : customerNotifs)(colors.tint)[locale];

  return (
    <Screen scroll>
      <Header showBack title={t('notif.title')} rightIcon="check-circle" />
      {notifs.length === 0 ? (
        <View style={{ marginTop: 60 }}>
          <EmptyState icon="bell" title={t('notif.empty')} description={t('notif.emptyDesc')} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {notifs.map((n, i) => (
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
