import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useToast } from '@/components/feedback/Toast';
import { useNotificationFeed, type FeedItem } from '@/hooks/useNotificationFeed';
import { groupByDay } from '@/lib/notificationGroups';
import { confirmAction } from '@/lib/confirm';
import { timeAgo } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { config } from '@/lib/config';

type Tab = 'all' | 'unread';

export default function Notifications() {
  const { t } = useT();
  const toast = useToast();
  const feed = useNotificationFeed();
  const [tab, setTab] = useState<Tab>('all');
  const all = feed.items ?? [];
  const shown = tab === 'unread' ? all.filter((n) => !n.read) : all;

  const open = (n: FeedItem) => {
    if (!n.read) feed.markRead(n.id);
    if (n.route) router.push(n.route as any);
  };

  const clearAll = async () => {
    const ok = await confirmAction({
      title: t('notif.clearTitle'),
      message: t('notif.clearBody'),
      confirmLabel: t('notif.clearYes'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await feed.clear();
    } catch {
      toast('error', t('notif.clearFailed'));
    }
  };

  return (
    <Screen scroll>
      <Header showBack title={t('notif.title')} rightIcon={feed.unread ? 'check-circle' : undefined} onRightPress={feed.markAllRead} />

      {feed.items === null ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : all.length === 0 ? (
        <View style={{ marginTop: 60 }}>
          <EmptyState icon="bell" title={t('notif.empty')} description={t('notif.emptyDesc')} />
        </View>
      ) : (
        <>
          <Segmented<Tab>
            options={[
              { key: 'all', label: t('notif.all') },
              { key: 'unread', label: feed.unread ? `${t('notif.unread')} (${feed.unread})` : t('notif.unread') },
            ]}
            value={tab}
            onChange={setTab}
          />
          <Pressable onPress={clearAll} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginTop: 14 }}>
            <Icon name="trash" size={14} color="#EF4444" />
            <Text variant="caption" style={{ color: '#EF4444' }}>
              {t('notif.clearAll')}
            </Text>
          </Pressable>

          {shown.length === 0 ? (
            <View style={{ marginTop: 50 }}>
              <EmptyState icon="check-circle" title={t('notif.noUnread')} />
            </View>
          ) : (
            groupByDay(shown).map(({ group, items }) => (
              <View key={group} style={{ marginTop: 18, gap: 10 }}>
                <Text variant="overline" tone="muted" style={{ marginHorizontal: 4 }}>
                  {t(`notif.${group}`)}
                </Text>
                {items.map((n, i) => (
                  <Animated.View key={n.id} entering={FadeInDown.delay(i * 50).duration(350)} exiting={FadeOut.duration(200)} layout={LinearTransition}>
                    <Row n={n} onOpen={() => open(n)} onDelete={() => feed.remove(n.id)} />
                  </Animated.View>
                ))}
              </View>
            ))
          )}
        </>
      )}

      {!config.useMock && (
        <Pressable onPress={() => router.push('/(shared)/push-check')} hitSlop={8} style={{ alignSelf: 'center', marginTop: 28, marginBottom: 8 }}>
          <Text variant="caption" tone="primary">
            {t('push.link')}
          </Text>
        </Pressable>
      )}
    </Screen>
  );
}

function Row({ n, onOpen, onDelete }: { n: FeedItem; onOpen: () => void; onDelete: () => void }) {
  const { colors } = useTheme();
  const { t } = useT();
  return (
    <Card onPress={n.route || !n.read ? onOpen : undefined} style={{ backgroundColor: n.read ? undefined : colors.tint + '0C' }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: n.color + '20', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={n.icon} size={20} color={n.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.tint }} />}
            <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
              {n.title}
            </Text>
          </View>
          <Text variant="caption" tone="muted" style={{ lineHeight: 18 }}>
            {n.body}
          </Text>
          <Text variant="overline" tone="muted" style={{ marginTop: 2 }}>
            {timeAgo(n.ts)}
          </Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('notif.delete')} style={{ padding: 4 }}>
          <Icon name="x" size={16} color={colors.muted} />
        </Pressable>
      </View>
    </Card>
  );
}
