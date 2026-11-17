// The chat with the Qareeb team: supportThreads/{uid} (one per account) and
// its messages. The dashboard's Support page answers it. It stays open to a
// suspended account, which can use nothing else. Messages are plain text, for
// the team to read. Demo mode keeps the thread on the device and answers with
// a canned reply.
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { translate } from '@/i18n';
import type { AppUser } from '@/types';

export const SUPPORT_TEXT_MAX = 1000;

export interface SupportMessage {
  id: string;
  from: 'user' | 'admin';
  senderId: string;
  text: string;
  createdAt: number;
}

export interface SupportThread {
  lastFrom?: 'user' | 'admin';
  /** A reply from the team the user hasn't seen yet. */
  unreadForUser?: boolean;
}

const threadRef = (uid: string) => doc(getDb()!, 'supportThreads', uid);
const messagesRef = (uid: string) => collection(getDb()!, 'supportThreads', uid, 'messages');

// ── Demo mode: an in-memory thread ───────────────────────────────────────────
const demo: SupportMessage[] = [];
const demoListeners = new Set<(m: SupportMessage[]) => void>();
const demoEmit = () => demoListeners.forEach((cb) => cb([...demo]));

/** The thread's messages, oldest first, kept up to date. Returns an unsubscribe. */
export function subscribeSupportMessages(uid: string, cb: (messages: SupportMessage[]) => void, onError?: () => void): () => void {
  if (config.useMock || !getDb()) {
    demoListeners.add(cb);
    cb([...demo]);
    return () => demoListeners.delete(cb);
  }
  return onSnapshot(
    query(messagesRef(uid), orderBy('createdAt', 'asc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupportMessage, 'id'>) }))),
    () => onError?.(),
  );
}

/** The thread header (whether a reply is waiting), kept up to date. */
export function subscribeSupportThread(uid: string, cb: (thread: SupportThread | null) => void): () => void {
  if (config.useMock || !getDb()) {
    cb(null);
    return () => {};
  }
  return onSnapshot(
    threadRef(uid),
    (snap) => cb(snap.exists() ? (snap.data() as SupportThread) : null),
    () => cb(null),
  );
}

/** Sends a message to the team and marks the thread as waiting for them. */
export async function sendSupportMessage(user: AppUser, text: string): Promise<void> {
  const body = text.trim().slice(0, SUPPORT_TEXT_MAX);
  if (!body) return;
  const now = Date.now();
  if (config.useMock || !getDb()) {
    demo.push({ id: `d${now}`, from: 'user', senderId: user.uid, text: body, createdAt: now });
    demoEmit();
    setTimeout(() => {
      demo.push({ id: `d${Date.now()}`, from: 'admin', senderId: 'team', text: translate('support.demoReply'), createdAt: Date.now() });
      demoEmit();
    }, 1200);
    return;
  }
  await addDoc(messagesRef(user.uid), { from: 'user', senderId: user.uid, text: body, createdAt: now });
  // The header the dashboard lists threads by. Merged, so a reply waiting for
  // the user (unreadForUser) is left as it is.
  await setDoc(
    threadRef(user.uid),
    {
      uid: user.uid,
      name: user.fullName ?? '',
      role: user.role,
      phone: user.phone ?? '',
      lastMessage: body.slice(0, 200),
      lastAt: now,
      lastFrom: 'user',
      unreadForAdmin: true,
      updatedAt: now,
    },
    { merge: true },
  );
}

/** The user has seen the team's latest reply. */
export async function markSupportRead(uid: string): Promise<void> {
  if (config.useMock || !getDb()) return;
  await updateDoc(threadRef(uid), { unreadForUser: false }).catch(() => {});
}
