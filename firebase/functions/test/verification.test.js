// Runs against the Firestore emulator:
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
// The artisan hears about the verification decision, with the reason.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { notifyVerificationDecision } = await import('../src/verification.js');
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-verification' });
const db = getFirestore();
const notes = async (uid) => (await db.collection(`users/${uid}/notifications`).get()).docs.map((d) => d.data());

before(async () => {
  await db.doc('users/vr_a').set({ uid: 'vr_a', role: 'artisan', locale: 'ar' });
  await db.doc('users/vr_b').set({ uid: 'vr_b', role: 'artisan', locale: 'en' });
});

test('approved: the artisan is told they now receive requests', async () => {
  assert.equal(await notifyVerificationDecision(db, 'vr_a', { status: 'pending' }, { status: 'approved' }), 'approved');
  const [n] = await notes('vr_a');
  assert.equal(n.type, 'verificationApproved');
  assert.match(n.title, /توثيق/);
  assert.equal(n.data.route, '/(artisan)/dashboard');
});

test('rejected: the reason is in the notification', async () => {
  await notifyVerificationDecision(db, 'vr_b', { status: 'pending' }, { status: 'rejected', rejectReason: 'The ID photo is blurry' });
  const [n] = await notes('vr_b');
  assert.equal(n.type, 'verificationRejected');
  assert.match(n.body, /The ID photo is blurry/);
  assert.equal(n.data.route, '/(shared)/verification');
});

test('no notification when nothing was decided', async () => {
  assert.equal(await notifyVerificationDecision(db, 'vr_a', { status: 'approved' }, { status: 'approved' }), null);
  assert.equal(await notifyVerificationDecision(db, 'vr_a', { status: 'rejected' }, { status: 'pending' }), null);
  assert.equal((await notes('vr_a')).length, 1);
});
