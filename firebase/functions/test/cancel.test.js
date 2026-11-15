// Runs against the Firestore emulator:
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
// Who is told when a request is cancelled or an offer turned down, with the
// reason; and an artisan who adds a service is offered its open requests.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { notifyOfferClosed, notifyRequestCancelled } = await import('../src/handlers.js');
const { offerOpenRequests, startDispatch } = await import('../src/dispatch.js');
initializeApp({ projectId: 'demo-cancel' });
const db = getFirestore();
const MIN = 60_000;
const at = (km) => ({ latitude: 31.9038 + km / 111.2, longitude: 35.2034 });
const inbox = async (uid) => (await db.collection(`users/${uid}/notifications`).get()).docs.map((d) => d.data());
const latest = async (uid) => (await inbox(uid)).sort((a, b) => b.createdAt - a.createdAt)[0];

before(async () => {
  for (const [uid, role, km, cats] of [
    ['cust', 'customer', 0, null],
    ['art_a', 'artisan', 1, ['plumbing']],
    ['art_b', 'artisan', 1, ['plumbing']],
    ['carp', 'artisan', 1, ['plumbing']], // adds carpentry in a test below
    ['far_carp', 'artisan', 9, ['plumbing']],
  ]) {
    await db.doc(`users/${uid}`).set({ uid, role, fullName: uid, phone: `+9705990001${uid.length}${km}`, locale: 'ar', verified: true, status: 'active', location: at(km) });
    if (cats) await db.doc(`artisanProfiles/${uid}`).set({ uid, categoryIds: cats });
  }
});

test('customer cancels before accepting: every artisan who offered hears it, with the reason', async () => {
  await db.doc('requests/p1').set({ customerId: 'cust', title: 'Leak', status: 'CANCELLED', cancelledBy: 'cust', cancelChoice: 'found_other', cancelNote: 'neighbour fixed it' });
  await db.doc('offers/p1a').set({ requestId: 'p1', artisanId: 'art_a', customerId: 'cust', status: 'REJECTED', closedReason: 'REQUEST_CANCELLED' });
  await db.doc('offers/p1b').set({ requestId: 'p1', artisanId: 'art_b', customerId: 'cust', status: 'REJECTED', closedReason: 'REQUEST_CANCELLED' });
  await notifyRequestCancelled(db, 'p1', (await db.doc('requests/p1').get()).data());
  for (const uid of ['art_a', 'art_b']) {
    const n = await latest(uid);
    assert.equal(n.type, 'requestCancelledPending');
    assert.match(n.body, /وجد حلاً آخر/);
    assert.match(n.body, /neighbour fixed it/);
  }
});

test('the customer cancels an accepted job: the artisan hears it with the reason', async () => {
  const r = { customerId: 'cust', acceptedArtisanId: 'art_a', title: 'Heater', status: 'CANCELLED', cancelledBy: 'cust', cancelChoice: 'too_long' };
  await notifyRequestCancelled(db, 'p2', r);
  const n = await latest('art_a');
  assert.equal(n.type, 'cancelledByOther');
  assert.match(n.body, /cust/);
  assert.match(n.body, /الانتظار طويل/);
});

test('the artisan cancels: the customer hears it with the reason', async () => {
  const r = { customerId: 'cust', acceptedArtisanId: 'art_b', title: 'Door', status: 'CANCELLED', cancelledBy: 'art_b', cancelChoice: 'customer_unreachable' };
  await notifyRequestCancelled(db, 'p3', r);
  const n = await latest('cust');
  assert.equal(n.type, 'cancelledByOther');
  assert.match(n.body, /art_b/);
  assert.match(n.body, /تعذّر التواصل مع الزبون/);
});

test('an offer declined by the customer: the artisan hears it with the reason', async () => {
  await db.doc('requests/p4').set({ customerId: 'cust', title: 'Sink', status: 'PENDING' });
  const before = { requestId: 'p4', artisanId: 'art_a', status: 'PENDING' };
  await notifyOfferClosed(db, 'o4', before, { ...before, status: 'REJECTED', closedReason: 'REJECTED_BY_CUSTOMER', rejectChoice: 'price_high' });
  const n = await latest('art_a');
  assert.equal(n.type, 'offerRejected');
  assert.match(n.body, /Sink/);
  assert.match(n.body, /السعر مرتفع/);
});

test('another offer accepted: the other artisans hear it; cancelled/expired offers are not told twice', async () => {
  await db.doc('requests/p5').set({ customerId: 'cust', title: 'Tap', status: 'ACCEPTED', acceptedOfferId: 'o5a', acceptedArtisanId: 'art_a' });
  const before = { requestId: 'p5', artisanId: 'art_b', status: 'PENDING' };
  await notifyOfferClosed(db, 'o5b', before, { ...before, status: 'REJECTED', closedReason: 'OTHER_ACCEPTED' });
  assert.equal((await latest('art_b')).type, 'offerNotChosen');
  const count = (await inbox('art_b')).length;
  await notifyOfferClosed(db, 'o5c', before, { ...before, status: 'REJECTED', closedReason: 'REQUEST_CANCELLED' });
  await notifyOfferClosed(db, 'o5d', before, { ...before, status: 'REJECTED', closedReason: 'EXPIRED' });
  assert.equal((await inbox('art_b')).length, count);
});

test('an artisan who adds a service is offered its open requests within reach', async () => {
  const t0 = Date.now();
  await db.doc('requests/c1').set({ customerId: 'cust', title: 'Table', categoryId: 'carpentry', status: 'PENDING', offerCount: 0, location: at(0) });
  await startDispatch(db, 'c1', (await db.doc('requests/c1').get()).data(), t0);
  // An expired one, and one whose search hasn't reached 9 km.
  await db.doc('requests/c2').set({ customerId: 'cust', title: 'Old', categoryId: 'carpentry', status: 'PENDING', location: at(0), dispatch: { radiusKm: 12, startedAt: t0 - 40 * MIN, expiresAt: t0 - 10 * MIN } });
  await db.doc('artisanProfiles/carp').update({ categoryIds: ['plumbing', 'carpentry'] });
  await db.doc('artisanProfiles/far_carp').update({ categoryIds: ['plumbing', 'carpentry'] });
  assert.deepEqual(await offerOpenRequests(db, 'carp', ['carpentry'], t0), ['c1']);
  assert.deepEqual(await offerOpenRequests(db, 'far_carp', ['carpentry'], t0), [], 'beyond the 2 km reached so far');
  const r = (await db.doc('requests/c1').get()).data();
  assert.ok(r.notifiedArtisanIds.includes('carp'));
  assert.ok(!r.notifiedArtisanIds.includes('far_carp'));
  const n = (await inbox('carp')).find((x) => x.data?.requestId === 'c1');
  assert.equal(n?.type, 'newJob');
  // Offered once: running it again changes nothing.
  assert.deepEqual(await offerOpenRequests(db, 'carp', ['carpentry'], t0), []);
});
