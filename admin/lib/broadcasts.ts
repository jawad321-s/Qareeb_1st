// System notifications (broadcasts/{id}): written here, delivered by the
// onBroadcastCreated Cloud Function to everyone, customers or artisans — in
// the app's notifications and as a push.
'use client';

import { addDoc, collection } from 'firebase/firestore';
import { getDb, isLive } from './firebase';

export type Audience = 'all' | 'customers' | 'artisans';
export const TITLE_MAX = 80;
export const BODY_MAX = 500;

export interface BroadcastInput {
  audience: Audience;
  title: string;
  body: string;
  /** App screen opened when the notification is tapped (e.g. the plans). */
  route?: string;
  /** What it was sent for, shown in the history. */
  kind?: 'manual' | 'prices';
}

export async function sendBroadcast(input: BroadcastInput, by?: string): Promise<string | null> {
  const db = getDb();
  if (!isLive() || !db) {
    await new Promise((r) => setTimeout(r, 400));
    return null;
  }
  const ref = await addDoc(collection(db, 'broadcasts'), {
    audience: input.audience,
    title: input.title.trim().slice(0, TITLE_MAX),
    body: input.body.trim().slice(0, BODY_MAX),
    ...(input.route ? { route: input.route } : {}),
    kind: input.kind ?? 'manual',
    status: 'pending',
    createdAt: Date.now(),
    createdBy: by ?? null,
  });
  return ref.id;
}
