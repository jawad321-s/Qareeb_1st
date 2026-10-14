// Runs against the Firestore emulator:
//   firebase emulators:exec --only firestore "cd functions && npm test"
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { startDispatch, runDispatchTick, findArtisans } = await import('../src/dispatch.js');
initializeApp({ projectId: 'demo-dispatch' });
const db = getFirestore();
const MIN = 60_000;

// Ramallah centre; points roughly 1, 3, 7 and 15 km north.
const at = (km) => ({ latitude: 31.9038 + km / 111.2, longitude: 35.2034 });
const artisan = (uid, km, extra = {}) => ({
  user: { uid, role: 'artisan', fullName: uid, phone: `05990000${uid.slice(-2)}`, locale: 'ar', verified: true, status: 'active', location: at(km), ...extra },
  profile: { uid, categoryIds: ['plumbing'] },
});

before(async () => {
  const people = [
    artisan('a_1km', 1), artisan('a_3km', 3), artisan('a_7km', 7), artisan('a_15km', 15),
    artisan('a_unverified', 1, { verified: false }),
    { user: { uid: 'a_elec', role: 'artisan', fullName: 'e', verified: true, location: at(1) }, profile: { uid: 'a_elec', categoryIds: ['electrical'] } },
    artisan('a_self', 1, { phone: '0599123456' }), // the customer's own artisan account
  ];
  for (const p of people) {
    await db.doc(`users/${p.user.uid}`).set(p.user);
    await db.doc(`artisanProfiles/${p.user.uid}`).set(p.profile);
  }
  await db.doc('users/cust').set({ uid: 'cust', role: 'customer', fullName: 'Customer', phone: '+970599123456', locale: 'ar' });
});

async function newRequest(id, extra = {}) {
  const r = { customerId: 'cust', title: 'Leak', categoryId: 'plumbing', status: 'PENDING', offerCount: 0, location: at(0), ...extra };
  await db.doc(`requests/${id}`).set(r);
  return r;
}
const get = async (id) => (await db.doc(`requests/${id}`).get()).data();
const inbox = async (uid) => (await db.collection(`users/${uid}/notifications`).get()).docs.map((d) => d.data());

test('first wave: verified same-category artisans within 2 km only', async () => {
  const t0 = 1_000_000;
  await startDispatch(db, 'r1', await newRequest('r1'), t0);
  const r = await get('r1');
  assert.deepEqual(r.notifiedArtisanIds, ['a_1km']);
  assert.equal(r.dispatch.radiusKm, 2);
  assert.equal(r.dispatch.expiresAt, t0 + 30 * MIN);
  assert.equal((await inbox('a_1km')).filter((n) => n.type === 'newJob').length, 1);
  assert.equal((await inbox('a_unverified')).length, 0);
  assert.equal((await inbox('a_self')).length, 0);
});

test('radius grows 2 km every 5 minutes and only new artisans are notified', async () => {
  const t0 = 2_000_000;
  await startDispatch(db, 'r2', await newRequest('r2'), t0);
  await runDispatchTick(db, t0 + 4 * MIN);
  assert.equal((await get('r2')).dispatch.radiusKm, 2);
  await runDispatchTick(db, t0 + 5 * MIN); // 4 km → a_3km
  let r = await get('r2');
  assert.equal(r.dispatch.radiusKm, 4);
  assert.deepEqual(r.notifiedArtisanIds.sort(), ['a_1km', 'a_3km']);
  await runDispatchTick(db, t0 + 15 * MIN); // 8 km → a_7km
  r = await get('r2');
  assert.equal(r.dispatch.radiusKm, 8);
  assert.deepEqual(r.notifiedArtisanIds.sort(), ['a_1km', 'a_3km', 'a_7km']);
  await runDispatchTick(db, t0 + 29 * MIN); // max 12 km — a_15km never reached
  r = await get('r2');
  assert.equal(r.dispatch.radiusKm, 12);
  assert.ok(!r.notifiedArtisanIds.includes('a_15km'));
  const jobs = (await inbox('a_1km')).filter((n) => n.data.requestId === 'r2');
  assert.equal(jobs.length, 1, 'a_1km notified once for r2');
});

test('no offers after 30 minutes → cancelled with NO_OFFERS', async () => {
  const t0 = 3_000_000;
  await startDispatch(db, 'r3', await newRequest('r3'), t0);
  await runDispatchTick(db, t0 + 30 * MIN);
  const r = await get('r3');
  assert.equal(r.status, 'CANCELLED');
  assert.equal(r.cancelReason, 'NO_OFFERS');
});

test('a request with an offer stops expanding and is not cancelled', async () => {
  const t0 = 4_000_000;
  await startDispatch(db, 'r4', await newRequest('r4'), t0);
  await db.doc('requests/r4').update({ offerCount: 1 });
  await runDispatchTick(db, t0 + 31 * MIN);
  const r = await get('r4');
  assert.equal(r.status, 'PENDING');
  assert.equal(r.dispatch.radiusKm, 2);
});

test('with verification off, unverified artisans are included', async () => {
  const found = await findArtisans(db, { categoryId: 'plumbing', origin: at(0), radiusKm: 2, requireVerified: false });
  assert.deepEqual(found.map((f) => f.uid).sort(), ['a_1km', 'a_self', 'a_unverified']);
});
