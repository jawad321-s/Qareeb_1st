// Runs against the Firestore emulator (with the rest of the suite).
// Artisans hear a few days before their plan ends, and when it has ended.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { remindEndingPlans } = await import('../src/planReminders.js');
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-plans' });
const db = getFirestore();
const DAY = 24 * 3600 * 1000;
const NOW = 5_000_000_000_000;
const inbox = async (uid) => (await db.collection(`users/${uid}/notifications`).get()).docs.map((d) => d.get('type'));
const sub = (id, artisanId, expiresAt, extra = {}) =>
  db.doc(`subscriptions/${id}`).set({ artisanId, planId: 'quarter', activatedAt: expiresAt - 90 * DAY, expiresAt, status: 'active', ...extra });

before(async () => {
  for (const uid of ['p_soon', 'p_later', 'p_ended', 'p_renewed', 'p_cancelled']) {
    await db.doc(`users/${uid}`).set({ uid, role: 'artisan', locale: 'ar', status: 'active' });
  }
  await sub('s_soon', 'p_soon', NOW + 2 * DAY);
  await sub('s_later', 'p_later', NOW + 20 * DAY);
  await sub('s_ended', 'p_ended', NOW - 1000, { planId: 'trial' });
  // Renewed before the old plan ended: only the new one counts.
  await sub('s_old', 'p_renewed', NOW - 1000);
  await sub('s_new', 'p_renewed', NOW + 100 * DAY);
  await sub('s_cancelled', 'p_cancelled', NOW + DAY, { status: 'cancelled' });
  await db.doc('meta/planReminders').delete();
});

test('ending within 3 days or ended: told once each; later, renewed or cancelled plans are left alone', async () => {
  assert.deepEqual(await remindEndingPlans(db, NOW), { endingSoon: 1, ended: 1 });
  assert.deepEqual(await inbox('p_soon'), ['planEndingSoon']);
  assert.deepEqual(await inbox('p_ended'), ['planEnded']);
  assert.deepEqual(await inbox('p_later'), []);
  assert.deepEqual(await inbox('p_renewed'), []);
  assert.deepEqual(await inbox('p_cancelled'), []);
  // Within the hour: nothing runs. An hour later: nothing new to say.
  assert.equal(await remindEndingPlans(db, NOW + 1000), null);
  assert.deepEqual(await remindEndingPlans(db, NOW + 3600 * 1000), { endingSoon: 0, ended: 0 });
  assert.deepEqual(await inbox('p_soon'), ['planEndingSoon']);
  // The plan that was ending soon has now ended: one more notice.
  assert.deepEqual(await remindEndingPlans(db, NOW + 3 * DAY), { endingSoon: 0, ended: 1 });
  assert.deepEqual((await inbox('p_soon')).sort(), ['planEnded', 'planEndingSoon']);
});
