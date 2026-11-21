// Security rules for requests and offers: only the real steps of a request's
// life, by the person each belongs to; artisans read only the requests sent
// to them. Runs against the Firestore emulator:
//   cd firebase && npx firebase-tools emulators:exec --only firestore "cd rules-test && npm test"
import { test, before, beforeEach, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

const HOUR = 3600 * 1000;
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rules-requests',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(() => env.cleanup());

const now = Date.now();
const pending = (extra = {}) => ({
  customerId: 'cust', status: 'PENDING', title: 'Leak', description: 'Kitchen sink', categoryId: 'plumbing', offerCount: 1,
  location: { latitude: 31.5, longitude: 35.1, address: 'Hebron' }, createdAt: now, updatedAt: now,
  dispatch: { radiusKm: 2 }, notifiedArtisanIds: ['art'], ...extra,
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [['cust', 'customer'], ['cust2', 'customer'], ['art', 'artisan'], ['art2', 'artisan'], ['friend', 'artisan']]) {
      await setDoc(doc(db, 'users', uid), { uid, role, status: 'active' });
    }
    await setDoc(doc(db, 'requests', 'open'), pending());
    await setDoc(doc(db, 'offers', 'o1'), { requestId: 'open', artisanId: 'art', customerId: 'cust', status: 'PENDING', price: 100 });
    await setDoc(doc(db, 'requests', 'hired'), pending({ status: 'ACCEPTED', acceptedArtisanId: 'art', acceptedOfferId: 'o2' }));
    await setDoc(doc(db, 'offers', 'o2'), { requestId: 'hired', artisanId: 'art', customerId: 'cust', status: 'ACCEPTED', price: 90 });
    await setDoc(doc(db, 'requests', 'gone'), pending({ status: 'CANCELLED', cancelReason: 'EXPIRED' }));
    await setDoc(doc(db, 'offers', 'o3'), { requestId: 'gone', artisanId: 'art', customerId: 'cust', status: 'PENDING', price: 80 });
    await setDoc(doc(db, 'requests', 'stale'), pending({ status: 'WORKING', acceptedArtisanId: 'art', updatedAt: now - 49 * HOUR }));
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();

test('an artisan reads only the requests sent to them, or the ones they were hired for', async () => {
  await assertSucceeds(getDoc(doc(as('art'), 'requests', 'open')));
  await assertFails(getDoc(doc(as('art2'), 'requests', 'open')));
  await assertSucceeds(getDocs(query(collection(as('art'), 'requests'), where('notifiedArtisanIds', 'array-contains', 'art'))));
  // The app's query (open AND sent to me): also passes the rules before these.
  await assertSucceeds(getDocs(query(collection(as('art'), 'requests'), where('status', '==', 'PENDING'), where('notifiedArtisanIds', 'array-contains', 'art'))));
  await assertSucceeds(getDocs(query(collection(as('art'), 'requests'), where('acceptedArtisanId', '==', 'art'))));
  // Every open request in the area, with the customers' locations: no.
  await assertFails(getDocs(query(collection(as('art2'), 'requests'), where('status', '==', 'PENDING'))));
  await assertSucceeds(getDoc(doc(as('cust'), 'requests', 'open')));
  await assertFails(getDoc(doc(as('cust2'), 'requests', 'open')));
});

test('the customer accepts an offer on a request still waiting for offers', async () => {
  const db = as('cust');
  const batch = writeBatch(db);
  batch.update(doc(db, 'offers', 'o1'), { status: 'ACCEPTED' });
  batch.update(doc(db, 'requests', 'open'), { status: 'ACCEPTED', acceptedOfferId: 'o1', acceptedArtisanId: 'art', updatedAt: Date.now() });
  await assertSucceeds(batch.commit());
});

test('no offer can be accepted on a cancelled or expired request', async () => {
  const db = as('cust');
  await assertFails(updateDoc(doc(db, 'offers', 'o3'), { status: 'ACCEPTED' }));
  await assertFails(updateDoc(doc(db, 'requests', 'gone'), { status: 'ACCEPTED', acceptedOfferId: 'o3', acceptedArtisanId: 'art', updatedAt: Date.now() }));
});

test('a customer cannot fake a finished job for an artisan (fake ratings, featured badge)', async () => {
  const db = as('cust');
  await assertFails(updateDoc(doc(db, 'requests', 'open'), { status: 'COMPLETED', acceptedArtisanId: 'friend', updatedAt: Date.now() }));
  // Nor hire someone who never quoted (no such offer).
  await assertFails(updateDoc(doc(db, 'requests', 'open'), { status: 'ACCEPTED', acceptedOfferId: 'o1', acceptedArtisanId: 'friend', updatedAt: Date.now() }));
  await assertFails(updateDoc(doc(db, 'requests', 'open'), { status: 'ACCEPTED', acceptedOfferId: 'nope', acceptedArtisanId: 'friend', updatedAt: Date.now() }));
  // Nor rate them afterwards, as the request never finished.
  await assertFails(setDoc(doc(db, 'reviews', 'open_cust'), { requestId: 'open', authorId: 'cust', targetId: 'friend', rating: 5 }));
  // Nor rewrite the request in other ways.
  await assertFails(updateDoc(doc(db, 'requests', 'hired'), { status: 'COMPLETED', updatedAt: Date.now() }));
  await assertFails(updateDoc(doc(db, 'requests', 'hired'), { acceptedArtisanId: 'friend' }));
});

test('cancelling: the customer any time before work starts, the hired artisan once hired, signed with who did it', async () => {
  await assertSucceeds(updateDoc(doc(as('cust'), 'requests', 'open'), { status: 'CANCELLED', cancelledBy: 'cust', cancelChoice: null, cancelNote: null, updatedAt: Date.now() }));
  await assertFails(updateDoc(doc(as('cust'), 'requests', 'hired'), { status: 'CANCELLED', cancelledBy: 'art', updatedAt: Date.now() }));
  await assertSucceeds(updateDoc(doc(as('art'), 'requests', 'hired'), { status: 'CANCELLED', cancelledBy: 'art', cancelChoice: 'busy', cancelNote: null, updatedAt: Date.now() }));
  await assertFails(updateDoc(doc(as('art'), 'requests', 'stale'), { status: 'CANCELLED', cancelledBy: 'art', updatedAt: Date.now() }));
});

test('the hired artisan moves the job on one step at a time, and nothing else', async () => {
  const db = as('art');
  await assertFails(updateDoc(doc(db, 'requests', 'hired'), { status: 'COMPLETED', updatedAt: Date.now() }));
  await assertFails(updateDoc(doc(db, 'requests', 'hired'), { status: 'ON_THE_WAY', customerId: 'art', updatedAt: Date.now() }));
  await assertSucceeds(updateDoc(doc(db, 'requests', 'hired'), { status: 'ON_THE_WAY', updatedAt: Date.now() }));
  await assertFails(updateDoc(doc(as('art2'), 'requests', 'hired'), { status: 'WORKING', updatedAt: Date.now() }));
});

test('a job left unfinished completes after 48 hours, not before', async () => {
  await assertSucceeds(updateDoc(doc(as('cust'), 'requests', 'stale'), { status: 'COMPLETED', completedAt: Date.now(), updatedAt: Date.now(), autoCompleted: true }));
  await assertFails(updateDoc(doc(as('cust'), 'requests', 'hired'), { status: 'COMPLETED', completedAt: Date.now(), updatedAt: Date.now(), autoCompleted: true }));
});

test('an artisan who quoted bumps the offer count by exactly one', async () => {
  await assertSucceeds(updateDoc(doc(as('art2'), 'requests', 'open'), { offerCount: 2, updatedAt: Date.now() }));
  await assertFails(updateDoc(doc(as('art2'), 'requests', 'open'), { offerCount: 5, updatedAt: Date.now() }));
});

test('offers: the customer decides, but never changes the price; the artisan only withdraws an open one', async () => {
  await assertFails(updateDoc(doc(as('cust'), 'offers', 'o1'), { price: 1 }));
  await assertSucceeds(updateDoc(doc(as('cust'), 'offers', 'o1'), { status: 'REJECTED', closedReason: 'REJECTED_BY_CUSTOMER', rejectChoice: 'price', rejectNote: null }));
  await assertFails(updateDoc(doc(as('art'), 'offers', 'o2'), { status: 'WITHDRAWN' }));
  await assertFails(updateDoc(doc(as('art'), 'offers', 'o3'), { status: 'WITHDRAWN', price: 1 }));
});

test('a new request starts clean: no artisan hired, no dispatch', async () => {
  const db = as('cust');
  await assertSucceeds(setDoc(doc(db, 'requests', 'new1'), { customerId: 'cust', status: 'PENDING', title: 'Paint', description: 'Two rooms', offerCount: 0, createdAt: now, updatedAt: now }));
  await assertFails(setDoc(doc(db, 'requests', 'new2'), { customerId: 'cust', status: 'PENDING', title: 'Paint', description: 'Two rooms', offerCount: 0, acceptedArtisanId: 'friend', createdAt: now, updatedAt: now }));
});
