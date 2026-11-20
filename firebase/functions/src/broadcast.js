// System notifications from the admin dashboard (broadcasts/{id}): a title
// and message for everyone, customers only or artisans only. Each recipient
// gets it in the app's notifications and as a push. Suspended accounts are
// skipped.
import { notifyUsers } from './notify.js';

export const AUDIENCES = { all: ['customer', 'artisan'], customers: ['customer'], artisans: ['artisan'] };
const CHUNK = 200; // users per batch of in-app notifications (a batch holds 500 writes)

/** Recipients of an audience: active customer and/or artisan accounts. */
export async function audienceUids(db, audience) {
  const roles = AUDIENCES[audience];
  if (!roles) return [];
  const snap = await db.collection('users').where('role', 'in', roles).get();
  return snap.docs.filter((d) => !['suspended', 'deleted'].includes(d.get('status'))).map((d) => d.id);
}

/**
 * Sends a broadcast once: it is claimed ('pending' → 'sending') in a
 * transaction so a retried trigger never sends it twice, then marked 'sent'
 * with the number of recipients (or 'failed').
 */
export async function deliverBroadcast(db, id) {
  const ref = db.collection('broadcasts').doc(id);
  const b = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get('status') !== 'pending') return null;
    tx.update(ref, { status: 'sending', startedAt: Date.now() });
    return snap.data();
  });
  if (!b) return null;
  try {
    const uids = await audienceUids(db, b.audience);
    const data = typeof b.route === 'string' && b.route.startsWith('/') ? { route: b.route, broadcastId: id } : { broadcastId: id };
    for (let i = 0; i < uids.length; i += CHUNK) {
      await notifyUsers(db, uids.slice(i, i + CHUNK), 'system', { title: b.title, body: b.body }, data);
    }
    await ref.update({ status: 'sent', recipients: uids.length, sentAt: Date.now() });
    return uids.length;
  } catch (e) {
    await ref.update({ status: 'failed', error: String(e?.message ?? e).slice(0, 300) });
    throw e;
  }
}
