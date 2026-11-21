// Security rules for a request's chat: replies, and "delete for everyone" by
// the message's sender only, while the chat is open. Runs against the
// Firestore emulator (see requests.test.js for the command).
import { test, before, beforeEach, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteField, doc, setDoc, updateDoc } from 'firebase/firestore';

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rules-chat',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(() => env.cleanup());

const now = Date.now();
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [uid, role] of [['cust', 'customer'], ['art', 'artisan'], ['other', 'artisan']]) {
      await setDoc(doc(db, 'users', uid), { uid, role, status: 'active' });
    }
    await setDoc(doc(db, 'requests', 'open'), { customerId: 'cust', acceptedArtisanId: 'art', status: 'WORKING', title: 'Leak', createdAt: now, updatedAt: now });
    await setDoc(doc(db, 'requests', 'done'), { customerId: 'cust', acceptedArtisanId: 'art', status: 'COMPLETED', title: 'Leak', createdAt: now, updatedAt: now });
    for (const r of ['open', 'done']) {
      await setDoc(doc(db, 'requests', r, 'messages', 'm1'), { senderId: 'cust', type: 'text', cipher: 'xyz', v: 1, read: false, createdAt: now });
      await setDoc(doc(db, 'requests', r, 'messages', 'm2'), { senderId: 'art', type: 'image', cipher: 'abc', v: 1, read: false, createdAt: now });
    }
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const msg = (db, r, id) => doc(db, 'requests', r, 'messages', id);
const del = { deleted: true, deletedAt: now, cipher: deleteField() };

test('a reply names the message it answers; nothing arrives already deleted', async () => {
  const db = as('art');
  await assertSucceeds(setDoc(msg(db, 'open', 'r1'), { senderId: 'art', type: 'text', cipher: 'q', v: 1, read: false, createdAt: now, replyTo: 'm1' }));
  await assertFails(setDoc(msg(db, 'open', 'r2'), { senderId: 'art', type: 'text', cipher: 'q', v: 1, read: false, createdAt: now, replyTo: 42 }));
  await assertFails(setDoc(msg(db, 'open', 'r3'), { senderId: 'art', type: 'text', cipher: 'q', v: 1, read: false, createdAt: now, deleted: true }));
});

test('the sender deletes their own message for everyone while the chat is open', async () => {
  await assertSucceeds(updateDoc(msg(as('cust'), 'open', 'm1'), del));
  await assertSucceeds(updateDoc(msg(as('art'), 'open', 'm2'), del));
});

test("nobody deletes someone else's message, nor one in a chat that has ended", async () => {
  await assertFails(updateDoc(msg(as('art'), 'open', 'm1'), del));
  await assertFails(updateDoc(msg(as('other'), 'open', 'm1'), del));
  await assertFails(updateDoc(msg(as('cust'), 'done', 'm1'), del));
});

test('deleting removes the content for good, and only that', async () => {
  // The encrypted content can't stay, nor be swapped for other content.
  await assertFails(updateDoc(msg(as('cust'), 'open', 'm1'), { deleted: true, deletedAt: now }));
  await assertFails(updateDoc(msg(as('cust'), 'open', 'm1'), { deleted: true, deletedAt: now, cipher: 'other' }));
  await assertFails(updateDoc(msg(as('cust'), 'open', 'm1'), { ...del, senderId: 'art' }));
  // Once deleted, it stays deleted.
  await assertSucceeds(updateDoc(msg(as('cust'), 'open', 'm1'), del));
  await assertFails(updateDoc(msg(as('cust'), 'open', 'm1'), { deleted: false, deletedAt: now }));
  // The read mark still works, by the other side.
  await assertSucceeds(updateDoc(msg(as('art'), 'open', 'm1'), { read: true }));
});
