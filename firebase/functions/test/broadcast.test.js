// Runs against the Firestore emulator:
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
// System notifications from the dashboard reach the chosen audience, once.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { deliverBroadcast, audienceUids } = await import('../src/broadcast.js');
initializeApp({ projectId: 'demo-broadcast' });
const db = getFirestore();
const inbox = async (uid) => (await db.collection(`users/${uid}/notifications`).get()).docs.map((d) => d.data());

before(async () => {
  const people = [['c1', 'customer'], ['c2', 'customer'], ['a1', 'artisan'], ['a2', 'artisan'], ['a3', 'artisan', 'suspended'], ['adm', 'admin']];
  for (const [uid, role, status = 'active'] of people) await db.doc(`users/${uid}`).set({ uid, role, status, fullName: uid, locale: uid === 'c2' ? 'en' : 'ar' });
});

const broadcast = (id, extra) => db.doc(`broadcasts/${id}`).set({ title: 'تحديث أسعار الاشتراكات', body: 'أسعار الباقات تغيّرت.', audience: 'all', status: 'pending', createdAt: 1, ...extra });

test('audiences: everyone, customers or artisans — never suspended accounts or admins', async () => {
  assert.deepEqual((await audienceUids(db, 'all')).sort(), ['a1', 'a2', 'c1', 'c2']);
  assert.deepEqual((await audienceUids(db, 'customers')).sort(), ['c1', 'c2']);
  assert.deepEqual((await audienceUids(db, 'artisans')).sort(), ['a1', 'a2']);
  assert.deepEqual(await audienceUids(db, 'nobody'), []);
});

test('artisans-only broadcast lands in each artisan inbox with its link, and is marked sent', async () => {
  await broadcast('b1', { audience: 'artisans', route: '/(shared)/subscription' });
  assert.equal(await deliverBroadcast(db, 'b1'), 2);
  const n = (await inbox('a1')).find((x) => x.data?.broadcastId === 'b1');
  assert.equal(n.type, 'system');
  assert.equal(n.title, 'تحديث أسعار الاشتراكات');
  assert.equal(n.body, 'أسعار الباقات تغيّرت.');
  assert.equal(n.data.route, '/(shared)/subscription');
  assert.equal((await inbox('c1')).filter((x) => x.data?.broadcastId === 'b1').length, 0);
  assert.equal((await inbox('a3')).length, 0, 'suspended artisan skipped');
  const b = (await db.doc('broadcasts/b1').get()).data();
  assert.equal(b.status, 'sent');
  assert.equal(b.recipients, 2);
});

test('a broadcast is delivered once even if the trigger runs again', async () => {
  await broadcast('b2', { audience: 'customers' });
  await deliverBroadcast(db, 'b2');
  assert.equal(await deliverBroadcast(db, 'b2'), null);
  assert.equal((await inbox('c2')).filter((x) => x.data?.broadcastId === 'b2').length, 1);
  // The same text whatever the user's language.
  assert.equal((await inbox('c2')).find((x) => x.data?.broadcastId === 'b2').title, 'تحديث أسعار الاشتراكات');
});
