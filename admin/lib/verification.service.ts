// Verification service (admin side). Reads the shared `verificationRequests`
// collection the mobile app writes to, and persists approve/reject decisions
// back — flipping the artisan's `verified` flag so the mobile app reflects it.
'use client';

import {
  collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { getDb, isLive } from './firebase';
import { VERIFICATIONS, type VerificationItem } from './mock-data';

export const VERIFICATION_COLLECTION = 'verificationRequests';

type Decision = 'approved' | 'rejected';

/**
 * Subscribes to the live verification queue. On mock it emits the static list
 * once. Returns an unsubscribe function.
 */
export function subscribeVerifications(cb: (items: VerificationItem[]) => void): () => void {
  const db = getDb();
  if (!db || !isLive()) {
    cb(VERIFICATIONS);
    return () => {};
  }
  const q = query(collection(db, VERIFICATION_COLLECTION), orderBy('submittedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const items: VerificationItem[] = snap.docs.map((d) => {
      const v = d.data() as Record<string, any>;
      const submittedAt =
        v.submittedAt && typeof v.submittedAt.toMillis === 'function'
          ? v.submittedAt.toMillis()
          : v.submittedAt ?? Date.now();
      return {
        id: d.id,
        artisanId: v.artisanId ?? d.id,
        name: v.name ?? '—',
        category: v.category ?? (Array.isArray(v.categoryIds) ? v.categoryIds[0] : '') ?? '',
        submittedAt,
        status: v.status ?? 'pending',
      };
    });
    cb(items);
  });
}

/**
 * Persists an approve/reject decision. Updates the request, and reflects the
 * result on the artisan's user + profile records so the mobile badge updates.
 */
export async function decideVerification(item: VerificationItem, status: Decision): Promise<boolean> {
  const db = getDb();
  if (!db || !isLive()) return false;

  await updateDoc(doc(db, VERIFICATION_COLLECTION, item.id), {
    status,
    reviewedAt: serverTimestamp(),
  });
  await Promise.all([
    updateDoc(doc(db, 'users', item.artisanId), {
      verified: status === 'approved',
      status: status === 'approved' ? 'active' : 'active',
      updatedAt: serverTimestamp(),
    }).catch(() => {}),
    updateDoc(doc(db, 'artisanProfiles', item.artisanId), {
      verificationStatus: status,
    }).catch(() => {}),
  ]);
  return true;
}
