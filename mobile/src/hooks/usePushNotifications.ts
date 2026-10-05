import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { config } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';
import { registerForPush, routeOf } from '@/lib/push';

/**
 * Registers this device for push once signed in, refreshes data when a push
 * arrives in the foreground, and opens the screen a tapped push points to
 * (also when the tap launched the app).
 */
export function usePushNotifications(uid: string | undefined, ready: boolean) {
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (config.useMock || !uid) return;
    registerForPush(uid).catch((err) => console.warn('[push] registration failed', err));
  }, [uid]);

  useEffect(() => {
    if (config.useMock) return;
    const sub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready || !uid || !lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const route = routeOf(lastResponse);
    if (route) {
      queryClient.invalidateQueries();
      router.push(route as never);
    }
  }, [lastResponse, ready, uid]);
}
