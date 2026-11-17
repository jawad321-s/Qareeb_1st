// Chats used to be stored as plain text. Now every message is encrypted
// (`cipher`), so the old ones are deleted once: the messages, the chat photos
// they linked to, and the "new message" notifications that quoted their text.
// A marker in meta/chatCleanup makes it run a single time.

/** Storage path of a Firebase download URL (…/o/<encoded path>?alt=media…). */
export function storagePath(url) {
  const m = typeof url === 'string' && url.match(/\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * @param db      Firestore (admin)
 * @param bucket  () => Storage bucket, for the chat photos (failures ignored)
 */
export async function removePlainChats(db, bucket) {
  const marker = db.collection('meta').doc('chatCleanup');
  if ((await marker.get()).exists) return null;

  let messages = 0;
  let photos = 0;
  const all = await db.collectionGroup('messages').get();
  // Request chats only: the support chat with the team is not encrypted.
  const plain = all.docs.filter((d) => d.ref.parent.parent?.parent?.id === 'requests' && typeof d.get('cipher') !== 'string');
  for (let i = 0; i < plain.length; i += 400) {
    const batch = db.batch();
    plain.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  messages = plain.length;
  for (const d of plain) {
    const path = storagePath(d.get('mediaUrl'));
    if (!path?.startsWith('chat/')) continue;
    try {
      await bucket().file(path).delete({ ignoreNotFound: true });
      photos++;
    } catch {
      // Storage unavailable or already gone: the message is deleted anyway.
    }
  }

  // Bell notifications of type newMessage carried the message text.
  const notes = (await db.collectionGroup('notifications').get()).docs.filter((d) => d.get('type') === 'newMessage');
  for (let i = 0; i < notes.length; i += 400) {
    const batch = db.batch();
    notes.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  const result = { messages, photos, notifications: notes.length, doneAt: Date.now() };
  await marker.set(result);
  return result;
}
