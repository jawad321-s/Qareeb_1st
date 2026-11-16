// Runs against the Auth + Firestore emulators:
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
// The dashboard's user management: only admins, and each action does what
// the console would (login disabled, password set, account removed).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { manageUser } = await import('../src/adminUsers.js');
// Same project as the emulator, so a sign-in over REST sees the accounts made here.
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-adminusers' });
const db = getFirestore();
const auth = getAuth();
const admin = { uid: 'adm', role: 'admin', email: 'admin@test.dev' };
const call = (data, caller = admin) => manageUser(db, auth, caller, data);
const user = async (uid) => (await db.doc(`users/${uid}`).get()).data();
const rejects = (p, code, msg) => assert.rejects(p, (e) => e.code === code && (!msg || e.message === msg));

async function account(uid, role, extra = {}) {
  await auth.createUser({ uid, email: `${role}-${uid}@phone.qareeb.app`, password: 'secret123' }).catch(() => {});
  await db.doc(`users/${uid}`).set({ uid, role, fullName: uid, phone: `+97059900${uid.length}000`, status: 'active', verified: false, ...extra });
  if (role === 'artisan') await db.doc(`artisanProfiles/${uid}`).set({ uid, categoryIds: ['plumbing'], verificationStatus: 'pending' });
  await db.doc(`publicProfiles/${uid}`).set({ uid, role, fullName: uid });
}

before(async () => {
  await account('aucust', 'customer');
  await account('auart', 'artisan');
  await account('aubusy', 'artisan');
  await account('augone', 'customer');
  await db.doc('verificationRequests/auart').set({ artisanId: 'auart', status: 'pending' });
  await db.doc('verificationRequests/auart/files/id').set({ data: 'x' });
  await db.doc('users/augone/notifications/n1').set({ title: 'hi' });
  // art has an open offer; busy is working on a job; gone has an open request with an offer.
  await db.doc('offers/o_auart').set({ requestId: 'au_open', artisanId: 'auart', customerId: 'augone', status: 'PENDING', price: 100 });
  await db.doc('requests/au_open').set({ customerId: 'augone', status: 'PENDING', title: 'Leak', offerCount: 1 });
  await db.doc('requests/r_aubusy').set({ customerId: 'aucust', acceptedArtisanId: 'aubusy', status: 'WORKING', title: 'Paint' });
  await db.doc('requests/au_done').set({ customerId: 'augone', acceptedArtisanId: 'aubusy', status: 'COMPLETED', title: 'Old job' });
});

test('only admins may call it, and never on themselves', async () => {
  await rejects(call({ action: 'suspend', uid: 'aucust' }, null), 'permission-denied');
  await rejects(call({ action: 'suspend', uid: 'aucust' }, { uid: 'aucust', role: 'customer' }), 'permission-denied');
  await rejects(call({ action: 'explode', uid: 'aucust' }), 'invalid-argument');
  await rejects(call({ action: 'suspend', uid: '' }), 'invalid-argument');
  await rejects(call({ action: 'suspend', uid: 'nobody' }), 'not-found');
  await rejects(call({ action: 'suspend', uid: 'adm' }), 'failed-precondition', 'self');
});

test('suspend disables the login, marks the account and withdraws open offers; reactivate undoes it', async () => {
  const res = await call({ action: 'suspend', uid: 'auart', reason: 'شكاوى متكررة' });
  assert.equal(res.withdrawnOffers, 1);
  assert.equal((await auth.getUser('auart')).disabled, true);
  assert.equal((await user('auart')).status, 'suspended');
  assert.equal((await user('auart')).suspendReason, 'شكاوى متكررة');
  assert.equal((await db.doc('offers/o_auart').get()).get('status'), 'WITHDRAWN');
  await call({ action: 'reactivate', uid: 'auart' });
  assert.equal((await auth.getUser('auart')).disabled, false);
  assert.equal((await user('auart')).status, 'active');
  const log = await db.collection('adminLog').where('uid', '==', 'auart').get();
  assert.deepEqual(log.docs.map((d) => d.get('action')).sort(), ['reactivate', 'suspend']);
  assert.equal(log.docs[0].get('byEmail'), 'admin@test.dev');
});

test('verify / unverify an artisan (not a customer)', async () => {
  await call({ action: 'verify', uid: 'auart' });
  assert.equal((await user('auart')).verified, true);
  assert.equal((await db.doc('artisanProfiles/auart').get()).get('verificationStatus'), 'approved');
  assert.equal((await db.doc('verificationRequests/auart').get()).get('status'), 'approved');
  await call({ action: 'unverify', uid: 'auart' });
  assert.equal((await user('auart')).verified, false);
  assert.equal((await db.doc('artisanProfiles/auart').get()).get('verificationStatus'), 'rejected');
  await rejects(call({ action: 'verify', uid: 'aucust' }), 'failed-precondition', 'not-artisan');
});

test('set a new password (6 characters or more)', async () => {
  await rejects(call({ action: 'setPassword', uid: 'aucust', password: '123' }), 'invalid-argument', 'weak-password');
  await call({ action: 'setPassword', uid: 'aucust', password: 'newpass1' });
  // The emulator accepts a sign-in with the new password.
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'customer-aucust@phone.qareeb.app', password: 'newpass1', returnSecureToken: true }),
  });
  assert.equal(r.status, 200);
});

test('accounts cannot be deleted from the dashboard', async () => {
  await rejects(call({ action: 'delete', uid: 'augone' }), 'invalid-argument');
  assert.ok((await user('augone')).uid, 'still there');
});
