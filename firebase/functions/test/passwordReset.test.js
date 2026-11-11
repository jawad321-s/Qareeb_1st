// Runs against the Auth emulator (with the rest of the suite):
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-qareeb' });
const auth = getAuth();
const { resetPasswordWithPhone, loginEmail } = await import('../src/passwordReset.js');

let customer;
before(async () => {
  // Start clean: earlier runs against the same emulator leave users behind.
  const { users } = await auth.listUsers();
  await auth.deleteUsers(users.map((u) => u.uid));
  customer = await auth.createUser({ email: loginEmail('+970599111222', 'customer'), password: 'old-pass' });
});

const phoneUser = (phone) => auth.createUser({ phoneNumber: phone });
const caller = (u) => ({ uid: u.uid, phone: u.phoneNumber, provider: 'phone' });

test('a verified number sets a new password on its own account', async () => {
  const p = await phoneUser('+970599111222');
  assert.deepEqual(await resetPasswordWithPhone(auth, caller(p), { role: 'customer', newPassword: 'new-pass-1' }), { ok: true });
  // The throwaway phone sign-in is gone; the real account is untouched apart from the password.
  await assert.rejects(auth.getUser(p.uid));
  assert.equal((await auth.getUser(customer.uid)).email, loginEmail('+970599111222', 'customer'));
});

test('+972 and 05… forms of the number reach the same account', async () => {
  const p = await phoneUser('+972599111222');
  assert.deepEqual(await resetPasswordWithPhone(auth, caller(p), { role: 'customer', newPassword: 'new-pass-2' }), { ok: true });
});

test('no artisan account on this number → not-found, and the phone sign-in is removed', async () => {
  const p = await phoneUser('+970599111223');
  await assert.rejects(resetPasswordWithPhone(auth, caller(p), { role: 'customer', newPassword: 'whatever1' }), { code: 'not-found' });
  await assert.rejects(auth.getUser(p.uid));
});

test('without a verified number nothing happens', async () => {
  await assert.rejects(resetPasswordWithPhone(auth, null, { role: 'customer', newPassword: 'x23456' }), { code: 'unauthenticated' });
});

test('too-short password and unknown role are refused', async () => {
  const p1 = await phoneUser('+970599111224');
  await assert.rejects(resetPasswordWithPhone(auth, caller(p1), { role: 'customer', newPassword: '123' }), { code: 'invalid-argument' });
  const p2 = await phoneUser('+970599111225');
  await assert.rejects(resetPasswordWithPhone(auth, caller(p2), { role: 'admin', newPassword: '123456' }), { code: 'invalid-argument' });
});
