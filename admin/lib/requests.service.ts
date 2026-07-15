// Requests service (admin side). Reads the shared `requests` collection the
// mobile customer app writes to, mapping it into the admin table shape. Falls
// back to the mock list when no Firebase project is configured.
'use client';

import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getDb, isLive } from './firebase';
import { REQUESTS, type AdminRequest } from './mock-data';

export const REQUESTS_COLLECTION = 'requests';

/**
 * Subscribes to the live requests feed. On mock it emits the static list once.
 * Returns an unsubscribe function.
 */
export function subscribeRequests(cb: (items: AdminRequest[]) => void): () => void {
  const db = getDb();
  if (!db || !isLive()) {
    cb(REQUESTS);
    return () => {};
  }
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items: AdminRequest[] = snap.docs.map((d) => {
      const v = d.data() as Record<string, any>;
      const createdAt =
        v.createdAt && typeof v.createdAt.toMillis === 'function' ? v.createdAt.toMillis() : v.createdAt ?? Date.now();
      return {
        id: d.id,
        title: v.title ?? '—',
        customer: v.customerName ?? v.customerId ?? '—',
        category: v.category ?? v.categoryId ?? '',
        status: v.status ?? 'PENDING',
        budgetMax: v.budget?.max ?? v.budgetMax ?? 0,
        offers: v.offerCount ?? v.offers ?? 0,
        createdAt,
      };
    });
    cb(items);
  });
}
