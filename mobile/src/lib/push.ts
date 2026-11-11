// Push notifications (Expo push service). The device's Expo push token is
// stored under users/{uid}/fcmTokens/{id}; Cloud Functions send to it.
//
// Remote push needs a development/production build with an EAS projectId
// (`eas init`). In Expo Go on Android it is unavailable, so registration is
// skipped there — the in-app notifications screen still works everywhere.
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import { kv } from './mmkv';

const TOKEN_KEY = 'qareeb.pushToken';

// Show notifications as banners while the app is open, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const projectId = (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ?? Constants.easConfig?.projectId;

/** Firestore doc ids can't contain "/" — Expo tokens don't, but keep it safe. */
const tokenDocId = (token: string) => token.replace(/[^A-Za-z0-9_-]/g, '_');

/** How registering this device for push went (shown by the notification check screen). */
export type PushRegistration =
  | { ok: true; token: string }
  | { ok: false; reason: 'unsupported' | 'android-expo-go' | 'no-project' | 'permission' | 'error'; message?: string };

const STATUS_KEY = 'qareeb.pushStatus';

/** The result of the last registration on this device, if any. */
export const lastPushRegistration = () => kv.get<PushRegistration & { at: number }>(STATUS_KEY);

/**
 * Gets this device's Expo push token and stores it under the user, so Cloud
 * Functions can reach the phone. Returns why not when it can't.
 */
export async function registerForPush(uid: string): Promise<PushRegistration> {
  const result = await register(uid).catch(
    (err): PushRegistration => ({ ok: false, reason: 'error', message: (err as Error)?.message ?? String(err) }),
  );
  kv.set(STATUS_KEY, { ...result, at: Date.now() });
  return result;
}

async function register(uid: string): Promise<PushRegistration> {
  const db = getDb();
  if (!db || Platform.OS === 'web' || !Device.isDevice) return { ok: false, reason: 'unsupported' };
  if (isExpoGo && Platform.OS === 'android') return { ok: false, reason: 'android-expo-go' };
  if (!projectId) {
    console.warn('[push] No EAS projectId — run `eas init` to enable push notifications.');
    return { ok: false, reason: 'no-project' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Qareeb',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return { ok: false, reason: 'permission' };

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await setDoc(doc(db, 'users', uid, 'fcmTokens', tokenDocId(token)), {
    token,
    platform: Platform.OS,
    updatedAt: Date.now(),
  });
  kv.set(TOKEN_KEY, token);
  return { ok: true, token };
}

/** Whether the user's account holds this device's token (what the server sends to). */
export async function isTokenSaved(uid: string, token: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  return (await getDoc(doc(db, 'users', uid, 'fcmTokens', tokenDocId(token)))).exists();
}

/**
 * Sends a notification straight to this device through Expo's push service,
 * as the Cloud Functions do. Returns Expo's error, if it reports one.
 */
export async function sendTestPush(token: string, title: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default', channelId: 'default', priority: 'high' }),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { status?: string; message?: string; details?: { error?: string } }; errors?: { message?: string }[] };
  const ticket = json.data;
  if (ticket?.status === 'ok') return { ok: true };
  return { ok: false, error: ticket?.details?.error ?? ticket?.message ?? json.errors?.[0]?.message ?? `HTTP ${res.status}` };
}

/** Stop pushes to this device for the signed-out account. */
export async function unregisterPush(uid: string): Promise<void> {
  const db = getDb();
  const token = kv.get<string>(TOKEN_KEY);
  kv.remove(TOKEN_KEY);
  if (!db || !token) return;
  await deleteDoc(doc(db, 'users', uid, 'fcmTokens', tokenDocId(token))).catch(() => {});
}

/** Route carried by a tapped notification (set by Cloud Functions). */
export function routeOf(response: Notifications.NotificationResponse | null): string | undefined {
  const route = response?.notification.request.content.data?.route;
  return typeof route === 'string' ? route : undefined;
}
