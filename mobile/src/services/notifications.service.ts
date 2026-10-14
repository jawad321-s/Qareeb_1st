// In-app notifications written by Cloud Functions to users/{uid}/notifications.
import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { AppNotification } from '@/types';

/** Live list of the user's latest notifications (null while loading). */
export function useLiveNotifications(uid: string | undefined): AppNotification[] | null {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  useEffect(() => {
    const db = getDb();
    if (!db || !uid) return;
    const q = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ ...(d.data() as AppNotification), id: d.id }))),
      () => setItems([]),
    );
  }, [uid]);
  return items;
}

export async function markNotificationRead(uid: string, id: string): Promise<void> {
  const db = getDb();
  if (db) await updateDoc(doc(db, 'users', uid, 'notifications', id), { read: true });
}

export async function markAllNotificationsRead(uid: string, ids: string[]): Promise<void> {
  const db = getDb();
  if (!db || ids.length === 0) return;
  const batch = writeBatch(db);
  ids.forEach((id) => batch.update(doc(db, 'users', uid, 'notifications', id), { read: true }));
  await batch.commit();
}
