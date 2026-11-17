// Runs against the Auth + Firestore emulators:
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
// A user deletes their own account from the app.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { deleteOwnAccount } = await import('../src/accountDeletion.js');
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-delete' });
const db = getFirestore();
const auth = getAuth();
const removed = [];
const bucket = () => ({ deleteFiles: async ({ prefix }) => removed.push(prefix) });
const nowS = () => Math.floor(Date.now() / 1000);
const rejects = (p, code, msg) => assert.rejects(p, (e) => e.code === code && (!msg || e.message === msg));

async function account(uid, role) {
  await auth.createUser({ uid, email: `${role}-${uid}@phone.qareeb.app`, password: 'secret123' }).catch(() => {});
  await db.doc(`users/${uid}`).set({ uid, role, fullName: uid, status: 'active' });
  await db.doc(`publicProfiles/${uid}`).set({ uid, role, fullName: uid });
  if (role === 'artisan') await db.doc(`artisanProfiles/${uid}`).set({ uid, categoryIds: ['plumbing'] });
}

before(async () => {
  await account('del_cust', 'customer');
  await account('del_art', 'artisan');
  await account('del_busy', 'artisan');
  await db.doc('users/del_cust/notifications/n1').set({ title: 'x' });
  await db.doc('requests/del_open').set({ customerId: 'del_cust', status: 'PENDING', title: 'Leak' });
  await db.doc('offers/del_o1').set({ requestId: 'del_open', artisanId: 'del_art', customerId: 'del_cust', status: 'PENDING', price: 100 });
  await db.doc('requests/del_done').set({ customerId: 'del_cust', acceptedArtisanId: 'del_art', status: 'COMPLETED', title: 'Old' });
  await db.doc('requests/del_work').set({ customerId: 'x', acceptedArtisanId: 'del_busy', status: 'WORKING', title: 'Paint' });
  await db.doc('verificationRequests/del_art').set({ artisanId: 'del_art', status: 'pending' });
  await db.doc('verificationRequests/del_art/files/id').set({ dataUrl: 'x' });
  await db.doc('supportThreads/del_cust').set({ uid: 'del_cust', lastFrom: 'user' });
  await db.doc('supportThreads/del_cust/messages/m1').set({ from: 'user', text: 'hi' });
});

test('needs a signed-in user who just entered their password', async () => {
  await rejects(deleteOwnAccount(db, auth, bucket, null), 'unauthenticated');
  await rejects(deleteOwnAccount(db, auth, bucket, { uid: 'del_cust', authTime: nowS() - 3600 }), 'failed-precondition', 'recent-login');
  // A suspended account talks to the team instead.
  await rejects(deleteOwnAccount(db, auth, bucket, { uid: 'del_cust', authTime: nowS(), suspended: true }), 'failed-precondition', 'suspended');
  assert.ok((await db.doc('users/del_cust').get()).exists);
});

test('refused while a job is in progress', async () => {
  await rejects(deleteOwnAccount(db, auth, bucket, { uid: 'del_busy', authTime: nowS() }), 'failed-precondition', 'active-jobs');
  assert.ok((await db.doc('users/del_busy').get()).exists);
});

test('a customer is removed for good; open requests are cancelled, history kept', async () => {
  const r = await deleteOwnAccount(db, auth, bucket, { uid: 'del_cust', authTime: nowS() });
  assert.equal(r.cancelledRequests, 1);
  await assert.rejects(auth.getUser('del_cust'), (e) => e.code === 'auth/user-not-found');
  assert.equal((await db.doc('users/del_cust').get()).exists, false);
  assert.equal((await db.doc('users/del_cust/notifications/n1').get()).exists, false);
  assert.equal((await db.doc('publicProfiles/del_cust').get()).exists, false);
  assert.equal((await db.doc('supportThreads/del_cust/messages/m1').get()).exists, false);
  assert.equal((await db.doc('requests/del_open').get()).get('status'), 'CANCELLED');
  assert.equal((await db.doc('offers/del_o1').get()).get('closedReason'), 'REQUEST_CANCELLED');
  assert.equal((await db.doc('requests/del_done').get()).get('status'), 'COMPLETED');
  assert.ok(removed.includes('users/del_cust/'));
});

test('an artisan: profile, verification files and open offers go too', async () => {
  await db.doc('offers/del_o2').set({ requestId: 'zz', artisanId: 'del_art', customerId: 'c', status: 'PENDING', price: 90 });
  const r = await deleteOwnAccount(db, auth, bucket, { uid: 'del_art', authTime: nowS() });
  assert.equal(r.withdrawnOffers, 1);
  assert.equal((await db.doc('artisanProfiles/del_art').get()).exists, false);
  assert.equal((await db.doc('verificationRequests/del_art/files/id').get()).exists, false);
  assert.equal((await db.doc('offers/del_o2').get()).get('status'), 'WITHDRAWN');
});
