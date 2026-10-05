// Delivers a notification to users: an in-app record under
// users/{uid}/notifications (the bell screen) plus a push to every device
// token the app registered under users/{uid}/fcmTokens (Expo push tokens).
import { logger } from 'firebase-functions/v2';
import { render } from './messages.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * @param db        Firestore (admin)
 * @param uids      recipients
 * @param type      key in MESSAGES
 * @param params    message params, or (uid) => params for per-recipient values
 * @param data      extra payload; `route` is opened when the push is tapped
 */
export async function notifyUsers(db, uids, type, params, data = {}) {
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return;
  const userSnaps = await db.getAll(...unique.map((uid) => db.collection('users').doc(uid)));

  const pushes = [];
  const batch = db.batch();
  for (const snap of userSnaps) {
    if (!snap.exists) continue;
    const locale = snap.get('locale') === 'en' ? 'en' : 'ar';
    const p = typeof params === 'function' ? params(snap.id) : params;
    const { title, body } = render(type, locale, p);
    batch.set(snap.ref.collection('notifications').doc(), {
      type,
      title,
      body,
      data,
      read: false,
      createdAt: Date.now(),
    });
    const tokens = await snap.ref.collection('fcmTokens').get();
    tokens.forEach((t) => {
      const token = t.get('token');
      if (typeof token === 'string' && token.startsWith('ExponentPushToken')) {
        pushes.push({ ref: t.ref, msg: { to: token, title, body, data: { ...data, type }, sound: 'default', channelId: 'default', priority: 'high' } });
      }
    });
  }
  await batch.commit();
  await sendExpoPushes(pushes);
}

async function sendExpoPushes(pushes) {
  if (pushes.length === 0 || process.env.PUSH_DRY_RUN === 'true') return;
  for (let i = 0; i < pushes.length; i += 100) {
    const chunk = pushes.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk.map((p) => p.msg)),
      });
      const json = await res.json();
      // Drop tokens of uninstalled apps so we stop sending to them.
      (json.data ?? []).forEach((ticket, idx) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          chunk[idx].ref.delete().catch(() => {});
        }
      });
    } catch (err) {
      logger.warn('Expo push failed', err);
    }
  }
}
