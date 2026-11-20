// Requests service (admin side). Reads the shared `requests` collection the
// mobile customer app writes to, mapping it into the admin table shape. Falls
// back to the mock list when no Firebase project is configured.
'use client';

import { getDb, isLive } from './firebase';
import { watchCollection } from './live-data';
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
  // The dashboard's shared listener: opening the page again shows the list at once.
  return watchCollection(REQUESTS_COLLECTION, (docs) =>
    cb(
      docs
        .filter((v) => v.createdAt != null)
        .map((v) => {
          const createdAt =
            v.createdAt && typeof v.createdAt.toMillis === 'function' ? v.createdAt.toMillis() : v.createdAt ?? Date.now();
          return {
            id: v.id,
            title: v.title ?? '—',
            customer: v.customerName ?? v.customerId ?? '—',
            category: v.category ?? v.categoryId ?? '',
            status: v.status ?? 'PENDING',
            offers: v.offerCount ?? v.offers ?? 0,
            createdAt,
          } as AdminRequest;
        })
        .sort((a, b) => b.createdAt - a.createdAt),
    ),
  );
}
