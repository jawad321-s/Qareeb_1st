// The signed-in user's notifications as the bell and the notifications screen
// show them, with the actions on them. Live, they come from
// users/{uid}/notifications (written by Cloud Functions); the demo uses sample
// feeds and keeps what was read or deleted for the session.
import { useMemo } from 'react';
import { create } from 'zustand';
import type { IconName } from '@/components/ui/Icon';
import { config } from '@/lib/config';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { artisanNotifs, customerNotifs } from '@/mock/notifications';
import {
  deleteAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  useLiveNotifications,
} from '@/services/notifications.service';
import type { AppNotification } from '@/types';

export interface FeedItem {
  id: string;
  icon: IconName;
  color: string;
  title: string;
  body: string;
  ts: number;
  read: boolean;
  route?: string;
}

// Icon + colour per notification type sent by Cloud Functions.
const TYPE_STYLE: Record<string, { icon: IconName; color?: string }> = {
  newJob: { icon: 'briefcase' },
  newOffer: { icon: 'wallet' },
  offerAccepted: { icon: 'check-circle', color: '#10B981' },
  onTheWay: { icon: 'navigation' },
  working: { icon: 'tools' },
  completed: { icon: 'star', color: '#F59E0B' },
  cancelledByOther: { icon: 'x-circle', color: '#EF4444' },
  noOffers: { icon: 'alert-circle', color: '#EF4444' },
  newMessage: { icon: 'message' },
};

const toItem = (n: AppNotification, tint: string): FeedItem => {
  const style = TYPE_STYLE[n.type] ?? { icon: 'bell' as IconName };
  return { id: n.id, icon: style.icon, color: style.color ?? tint, title: n.title, body: n.body, ts: n.createdAt, read: n.read, route: n.data?.route };
};

// Demo only: what the user read or deleted this session.
const useDemoState = create<{ read: Record<string, true>; deleted: Record<string, true> }>(() => ({ read: {}, deleted: {} }));
const markDemo = (key: 'read' | 'deleted', ids: string[]) =>
  useDemoState.setState((s) => ({ [key]: { ...s[key], ...Object.fromEntries(ids.map((id) => [id, true])) } }));

export function useNotificationFeed() {
  const { colors, role } = useTheme();
  const { locale } = useT();
  const uid = useAuth((s) => s.user?.uid);
  const live = useLiveNotifications(config.useMock ? undefined : uid);
  const demo = useDemoState();

  // null while the live list is loading.
  const items = useMemo<FeedItem[] | null>(() => {
    if (!config.useMock) return live && live.map((n) => toItem(n, colors.tint));
    return (role === 'artisan' ? artisanNotifs : customerNotifs)(colors.tint)
      [locale].filter((n) => !demo.deleted[n.id])
      .map((n) => (demo.read[n.id] ? { ...n, read: true } : n));
  }, [live, colors.tint, role, locale, demo]);

  const unread = (items ?? []).filter((n) => !n.read).length;

  const markRead = (ids: string[]) => {
    if (ids.length === 0) return;
    if (config.useMock) return markDemo('read', ids);
    if (uid) markAllNotificationsRead(uid, ids).catch(() => {});
  };

  return {
    items,
    unread,
    markRead: (id: string) => {
      if (config.useMock) markDemo('read', [id]);
      else if (uid) markNotificationRead(uid, id).catch(() => {});
    },
    markAllRead: () => markRead((items ?? []).filter((n) => !n.read).map((n) => n.id)),
    remove: (id: string) => {
      if (config.useMock) markDemo('deleted', [id]);
      else if (uid) deleteNotification(uid, id).catch(() => {});
    },
    clear: async () => {
      if (config.useMock) markDemo('deleted', (items ?? []).map((n) => n.id));
      else if (uid) await deleteAllNotifications(uid);
    },
  };
}
