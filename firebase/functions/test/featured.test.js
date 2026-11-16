// Runs against the Firestore emulator:
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
// Featured artisans: the badge comes from completed jobs counted on the
// server, and featured artisans are reached one radius step earlier.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { refreshArtisanStats, onJobCompleted, backfillFeatured, featuredThreshold } = await import('../src/featured.js');
const { findArtisans, startDispatch } = await import('../src/dispatch.js');
initializeApp({ projectId: 'demo-featured' });
const db = getFirestore();
const at = (km) => ({ latitude: 31.9038 + km / 111.2, longitude: 35.2034 });
const profile = async (uid) => (await db.doc(`artisanProfiles/${uid}`).get()).data();
const inbox = async (uid) => (await db.collection(`users/${uid}/notifications`).get()).docs.map((d) => d.data());

async function artisan(uid, km, profileExtra = {}) {
  await db.doc(`users/${uid}`).set({ uid, role: 'artisan', fullName: uid, phone: `05991111${uid.length}${km}`, locale: 'ar', verified: true, status: 'active', location: at(km) });
  await db.doc(`artisanProfiles/${uid}`).set({ uid, categoryIds: ['painting'], completedJobs: 0, ...profileExtra });
}
async function jobs(artisanId, n, status = 'COMPLETED', from = 0) {
  for (let i = 0; i < n; i++) {
    await db.doc(`requests/${artisanId}_${status}_${from + i}`).set({ customerId: 'c', acceptedArtisanId: artisanId, status, categoryId: 'painting', title: 'Job' });
  }
}

before(async () => {
  await db.doc('users/c').set({ uid: 'c', role: 'customer', fullName: 'C', phone: '+970599000999', locale: 'ar' });
  await artisan('pro', 3); // will have 10 completed jobs
  await artisan('newbie', 1); // 9 completed + others not completed
  await artisan('liar', 1, { completedJobs: 500 }); // a stored figure with no jobs behind it
  await jobs('pro', 10);
  await jobs('newbie', 9);
  await jobs('newbie', 4, 'CANCELLED');
  await jobs('newbie', 2, 'WORKING');
});

test('threshold defaults to 10 and follows the dashboard setting', async () => {
  assert.equal(await featuredThreshold(db), 10);
  await db.doc('settings/platform').set({ featuredMinJobs: 5 });
  assert.equal(await featuredThreshold(db), 5);
  await db.doc('settings/platform').set({ featuredMinJobs: 'x' });
  assert.equal(await featuredThreshold(db), 10);
  await db.doc('settings/platform').delete();
});

test('only completed jobs count; 10 makes an artisan featured, 9 does not', async () => {
  assert.deepEqual(await refreshArtisanStats(db, 'pro'), { completedJobs: 10, featured: true, became: true });
  assert.equal((await profile('pro')).featured, true);
  assert.deepEqual(await refreshArtisanStats(db, 'newbie'), { completedJobs: 9, featured: false, became: false });
  assert.equal((await profile('newbie')).completedJobs, 9);
  // A figure written by hand is replaced by the real count.
  await refreshArtisanStats(db, 'liar');
  assert.equal((await profile('liar')).completedJobs, 0);
  assert.notEqual((await profile('liar')).featured, true);
});

test('the 10th completed job brings the badge and a congratulation, once', async () => {
  await jobs('newbie', 1, 'COMPLETED', 100);
  const stats = await onJobCompleted(db, 'newbie');
  assert.equal(stats.completedJobs, 10);
  assert.equal(stats.became, true);
  assert.equal((await profile('newbie')).featured, true);
  await jobs('newbie', 1, 'COMPLETED', 200);
  await onJobCompleted(db, 'newbie');
  const congrats = (await inbox('newbie')).filter((n) => n.type === 'becameFeatured');
  assert.equal(congrats.length, 1);
  assert.match(congrats[0].title, /مميز/);
});

test('backfill runs once per threshold and re-runs when the admin changes it', async () => {
  await db.doc('meta/featured').delete().catch(() => {});
  await db.doc('artisanProfiles/pro').update({ featured: false });
  assert.ok((await backfillFeatured(db)) >= 3);
  assert.equal((await profile('pro')).featured, true);
  assert.equal(await backfillFeatured(db), 0, 'nothing to do the second time');
  await db.doc('settings/platform').set({ featuredMinJobs: 20 });
  assert.ok((await backfillFeatured(db)) >= 3);
  assert.equal((await profile('pro')).featured, false, 'below the new threshold');
  await db.doc('settings/platform').delete();
  await backfillFeatured(db);
  assert.equal((await profile('pro')).featured, true);
});

test('featured artisans are reached one step (2 km) further out, and listed first', async () => {
  // Radius 2 km: newbie (1 km) is in; pro (3 km) only because featured.
  const found = await findArtisans(db, { categoryId: 'painting', origin: at(0), radiusKm: 2 });
  const ids = found.map((f) => f.uid);
  assert.ok(ids.includes('pro'), 'featured artisan at 3 km gets the 2 km wave');
  assert.equal(found[0].featured, true);
  await db.doc('artisanProfiles/pro').update({ featured: false });
  const plain = (await findArtisans(db, { categoryId: 'painting', origin: at(0), radiusKm: 2 })).map((f) => f.uid);
  assert.ok(!plain.includes('pro'));
  await db.doc('artisanProfiles/pro').update({ featured: true });
  // The first wave of a real request reaches them too.
  await db.doc('requests/new1').set({ customerId: 'c', title: 'Paint', categoryId: 'painting', status: 'PENDING', offerCount: 0, location: at(0) });
  await startDispatch(db, 'new1', (await db.doc('requests/new1').get()).data(), 5_000_000);
  assert.ok((await db.doc('requests/new1').get()).get('notifiedArtisanIds').includes('pro'));
});
