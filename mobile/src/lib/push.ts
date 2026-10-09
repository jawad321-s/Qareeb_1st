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
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
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

export async function registerForPush(uid: string): Promise<void> {
  const db = getDb();
  if (!db || Platform.OS === 'web' || !Device.isDevice) return;
  if (isExpoGo && Platform.OS === 'android') return;
  if (!projectId) {
    console.warn('[push] No EAS projectId — run `eas init` to enable push notifications.');
    return;
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
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await setDoc(doc(db, 'users', uid, 'fcmTokens', tokenDocId(token)), {
    token,
    platform: Platform.OS,
    updatedAt: Date.now(),
  });
  kv.set(TOKEN_KEY, token);
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
