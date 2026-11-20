// Reminders about an artisan's plan (the subscription bought in the app):
// a few days before it ends, and when it has ended. Runs at most hourly from
// dispatchTick; each reminder is sent once per plan (marked on the
// subscription), and only for the artisan's latest plan, so renewing early
// never brings an "ended" notice for the old one.
import { notifyUsers } from './notify.js';

const DAY_MS = 24 * 3600 * 1000;
export const REMIND_BEFORE_MS = 3 * DAY_MS;
const CHECK_EVERY_MS = 3600 * 1000;
const ROUTE = { route: '/(shared)/subscription' };

export async function remindEndingPlans(db, now = Date.now()) {
  const marker = db.collection('meta').doc('planReminders');
  const last = (await marker.get()).get('at') ?? 0;
  if (now - last < CHECK_EVERY_MS) return null;
  await marker.set({ at: now });

  const active = await db.collection('subscriptions').where('status', '==', 'active').get();
  // The latest plan of each artisan (a renewal is a new subscription).
  const latest = new Map();
  for (const d of active.docs) {
    const s = d.data();
    if (!s.artisanId || typeof s.expiresAt !== 'number') continue;
    const prev = latest.get(s.artisanId);
    if (!prev || s.expiresAt > prev.data().expiresAt) latest.set(s.artisanId, d);
  }

  let endingSoon = 0;
  let ended = 0;
  for (const [artisanId, d] of latest) {
    const s = d.data();
    const left = s.expiresAt - now;
    const trial = s.planId === 'trial';
    if (left <= 0) {
      if (s.endedNoticeAt) continue;
      await notifyUsers(db, [artisanId], 'planEnded', { trial }, ROUTE);
      await d.ref.update({ endedNoticeAt: now });
      ended += 1;
    } else if (left <= REMIND_BEFORE_MS) {
      if (s.endingNoticeAt) continue;
      await notifyUsers(db, [artisanId], 'planEndingSoon', { days: Math.max(1, Math.ceil(left / DAY_MS)), trial }, ROUTE);
      await d.ref.update({ endingNoticeAt: now });
      endingSoon += 1;
    }
  }
  return { endingSoon, ended };
}
