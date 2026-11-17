// Runs against the Firestore emulator:
//   firebase emulators:exec --only auth,firestore "cd functions && npm test"
// Plain-text chats from before encryption are removed once; encrypted ones stay.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.PUSH_DRY_RUN = 'true';
const { removePlainChats, storagePath } = await import('../src/chatCleanup.js');
const { render } = await import('../src/messages.js');
initializeApp({ projectId: 'demo-chatcleanup' });
const db = getFirestore();
const deleted = [];
const fakeBucket = () => ({ file: (p) => ({ delete: async () => deleted.push(p) }) });

before(async () => {
  await db.doc('requests/r1/messages/m1').set({ senderId: 'c', type: 'text', text: 'رقم بيتي 12', createdAt: 1 });
  await db.doc('requests/r1/messages/m2').set({
    senderId: 'a', type: 'image', createdAt: 2,
    mediaUrl: 'https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/chat%2Fr1%2F123.jpg?alt=media&token=x',
  });
  await db.doc('requests/r1/messages/m3').set({ senderId: 'c', type: 'text', cipher: 'AAAA', v: 1, createdAt: 3 });
  // The support chat with the team is plain text on purpose.
  await db.doc('supportThreads/c/messages/s1').set({ senderId: 'c', from: 'user', text: 'حسابي موقوف', createdAt: 3 });
  await db.doc('users/a/notifications/n1').set({ type: 'newMessage', title: 'C', body: 'رقم بيتي 12' });
  await db.doc('users/a/notifications/n2').set({ type: 'newJob', title: 'Job', body: 'x' });
});

test('photo links map to their storage path', () => {
  assert.equal(storagePath('https://firebasestorage.googleapis.com/v0/b/x/o/chat%2Fr1%2Fa%20b.jpg?alt=media'), 'chat/r1/a b.jpg');
  assert.equal(storagePath(undefined), null);
});

test('removes plain messages, their photos and the notifications quoting them — once', async () => {
  const r = await removePlainChats(db, fakeBucket);
  assert.equal(r.messages, 2);
  assert.equal(r.notifications, 1);
  assert.deepEqual(deleted, ['chat/r1/123.jpg']);
  assert.equal((await db.doc('requests/r1/messages/m1').get()).exists, false);
  assert.equal((await db.doc('requests/r1/messages/m3').get()).exists, true, 'encrypted message kept');
  assert.equal((await db.doc('supportThreads/c/messages/s1').get()).exists, true, 'support chat kept');
  assert.equal((await db.doc('users/a/notifications/n2').get()).exists, true, 'other notifications kept');
  // A plain message written later (an old app) is not swept by a second run.
  await db.doc('requests/r1/messages/m4').set({ senderId: 'c', type: 'text', text: 'later', createdAt: 4 });
  assert.equal(await removePlainChats(db, fakeBucket), null);
});

test('new-message notifications never contain the text', () => {
  assert.deepEqual(render('newMessage', 'ar', { senderName: 'ليلى', image: false }), { title: 'ليلى', body: 'رسالة جديدة' });
  assert.deepEqual(render('newMessage', 'en', { senderName: 'Laila', image: true }), { title: 'Laila', body: '📷 Photo' });
});
