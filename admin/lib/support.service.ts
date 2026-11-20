// The Support page: users' chats with the Qareeb team (supportThreads/{uid}
// and their messages, written by the app's "Chat with Qareeb" screen). The
// team reads and answers them here; the user gets a notification for each
// reply (Cloud Function onSupportMessageCreated). Demo mode keeps a couple of
// threads in memory.
'use client';

import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { getAuthClient, getDb, isLive } from './firebase';
import { watchCollection } from './live-data';

export const SUPPORT_TEXT_MAX = 1000;

export interface SupportThread {
  uid: string;
  name: string;
  role: 'customer' | 'artisan' | string;
  phone?: string;
  lastMessage: string;
  lastAt: number;
  lastFrom: 'user' | 'admin';
  /** A message from the user the team hasn't opened yet. */
  unreadForAdmin: boolean;
}

export interface SupportMessage {
  id: string;
  from: 'user' | 'admin';
  text: string;
  createdAt: number;
}

// ── Demo data ────────────────────────────────────────────────────────────────
const now = Date.now();
const DEMO_THREADS: SupportThread[] = [
  { uid: 'u_1', name: 'أحمد خليل', role: 'customer', phone: '+970599000101', lastMessage: 'ليش انوقف حسابي؟ ما عملت إشي', lastAt: now - 12 * 60e3, lastFrom: 'user', unreadForAdmin: true },
  { uid: 'u_2', name: 'سامر النجار', role: 'artisan', phone: '+970599000202', lastMessage: 'تمام، شكراً إلكم', lastAt: now - 26 * 3600e3, lastFrom: 'user', unreadForAdmin: false },
];
const DEMO_MESSAGES: Record<string, SupportMessage[]> = {
  u_1: [{ id: 'm1', from: 'user', text: 'ليش انوقف حسابي؟ ما عملت إشي', createdAt: now - 12 * 60e3 }],
  u_2: [
    { id: 'm1', from: 'user', text: 'ما بتوصلني طلبات جديدة من امبارح', createdAt: now - 27 * 3600e3 },
    { id: 'm2', from: 'admin', text: 'فعّل زر "متاح للعمل" من الصفحة الرئيسية، كان مطفي عندك.', createdAt: now - 26.5 * 3600e3 },
    { id: 'm3', from: 'user', text: 'تمام، شكراً إلكم', createdAt: now - 26 * 3600e3 },
  ],
};
const demoListeners = new Set<() => void>();
const demoEmit = () => demoListeners.forEach((cb) => cb());

const toThread = (id: string, v: Record<string, any>): SupportThread => ({
  uid: v.uid ?? id,
  name: v.name ?? '—',
  role: v.role ?? 'customer',
  phone: v.phone || undefined,
  lastMessage: v.lastMessage ?? '',
  lastAt: Number(v.lastAt) || 0,
  lastFrom: v.lastFrom === 'admin' ? 'admin' : 'user',
  unreadForAdmin: v.unreadForAdmin === true,
});

/** Every thread, the latest message first. Returns an unsubscribe. */
export function subscribeSupportThreads(cb: (threads: SupportThread[]) => void): () => void {
  const db = getDb();
  if (!db || !isLive()) {
    const emit = () => cb([...DEMO_THREADS].sort((a, b) => b.lastAt - a.lastAt));
    demoListeners.add(emit);
    emit();
    return () => demoListeners.delete(emit);
  }
  // The dashboard's shared listener (the sidebar, the bell and the page read the same one).
  return watchCollection('supportThreads', (docs) =>
    cb(docs.filter((d) => d.lastAt != null).map((d) => toThread(d.id, d)).sort((a, b) => b.lastAt - a.lastAt)),
  );
}

/** One thread's messages, oldest first. */
export function subscribeSupportMessages(uid: string, cb: (messages: SupportMessage[]) => void): () => void {
  const db = getDb();
  if (!db || !isLive()) {
    const emit = () => cb([...(DEMO_MESSAGES[uid] ?? [])]);
    demoListeners.add(emit);
    emit();
    return () => demoListeners.delete(emit);
  }
  return onSnapshot(
    query(collection(db, 'supportThreads', uid, 'messages'), orderBy('createdAt', 'asc')),
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const v = d.data();
          return { id: d.id, from: v.from === 'admin' ? 'admin' : 'user', text: String(v.text ?? ''), createdAt: Number(v.createdAt) || 0 };
        }),
      ),
    (err) => {
      console.warn('[support messages]', err);
      cb([]);
    },
  );
}

/** The team opened the thread: no longer shown as waiting. */
export async function markThreadRead(uid: string): Promise<void> {
  const db = getDb();
  if (!db || !isLive()) {
    const t = DEMO_THREADS.find((x) => x.uid === uid);
    if (t?.unreadForAdmin) {
      t.unreadForAdmin = false;
      demoEmit();
    }
    return;
  }
  await updateDoc(doc(db, 'supportThreads', uid), { unreadForAdmin: false }).catch(() => {});
}

/** The team's answer; the user is notified on their phone. */
export async function replyToThread(uid: string, text: string): Promise<void> {
  const body = text.trim().slice(0, SUPPORT_TEXT_MAX);
  if (!body) return;
  const at = Date.now();
  const db = getDb();
  if (!db || !isLive()) {
    (DEMO_MESSAGES[uid] ??= []).push({ id: `m${at}`, from: 'admin', text: body, createdAt: at });
    const t = DEMO_THREADS.find((x) => x.uid === uid);
    if (t) Object.assign(t, { lastMessage: body, lastAt: at, lastFrom: 'admin', unreadForAdmin: false });
    demoEmit();
    return;
  }
  const me = getAuthClient()?.currentUser?.uid ?? 'admin';
  await addDoc(collection(db, 'supportThreads', uid, 'messages'), { from: 'admin', senderId: me, text: body, createdAt: at });
  await updateDoc(doc(db, 'supportThreads', uid), {
    lastMessage: body.slice(0, 200),
    lastAt: at,
    lastFrom: 'admin',
    unreadForAdmin: false,
    unreadForUser: true,
    updatedAt: at,
  });
}

/**
 * Deletes conversations for good: every message, then the thread itself. The
 * person can still write again later, which starts a new one.
 */
export async function deleteThreads(uids: string[]): Promise<void> {
  const db = getDb();
  if (!db || !isLive()) {
    for (const uid of uids) {
      const i = DEMO_THREADS.findIndex((x) => x.uid === uid);
      if (i >= 0) DEMO_THREADS.splice(i, 1);
      delete DEMO_MESSAGES[uid];
    }
    demoEmit();
    return;
  }
  for (const uid of uids) {
    const messages = await getDocs(collection(db, 'supportThreads', uid, 'messages'));
    // A batch holds at most 500 writes.
    for (let i = 0; i < messages.docs.length; i += 450) {
      const batch = writeBatch(db);
      messages.docs.slice(i, i + 450).forEach((m) => batch.delete(m.ref));
      await batch.commit();
    }
    const batch = writeBatch(db);
    batch.delete(doc(db, 'supportThreads', uid));
    await batch.commit();
  }
}
