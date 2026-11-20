// Verification service (admin side). Reads the shared `verificationRequests`
// collection the mobile app writes to, and persists approve/reject decisions
// back — flipping the artisan's `verified` flag so the mobile app reflects it.
'use client';

import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb, isLive } from './firebase';
import { watchCollection } from './live-data';
import { VERIFICATIONS, type VerificationItem } from './mock-data';

export const VERIFICATION_COLLECTION = 'verificationRequests';
/** Subcollection with the artisan's document photos (data URLs, one per doc). */
export const VERIFICATION_FILES = 'files';

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
  // The dashboard's shared listener (the bell and the page read the same one).
  return watchCollection(VERIFICATION_COLLECTION, (docs) => {
    const items: VerificationItem[] = docs
      .filter((v) => v.submittedAt != null)
      .map((v) => {
        const files: string[] = Array.isArray(v.files) ? v.files : [];
        const legacyUrls = legacyPhotoUrls(v);
        const submittedAt =
          v.submittedAt && typeof v.submittedAt.toMillis === 'function'
            ? v.submittedAt.toMillis()
            : v.submittedAt ?? Date.now();
        return {
          id: v.id,
          artisanId: v.artisanId ?? v.id,
          name: v.name ?? '—',
          category: v.category ?? (Array.isArray(v.categoryIds) ? v.categoryIds[0] : '') ?? '',
          submittedAt,
          status: v.status ?? 'pending',
          phone: v.phone ?? undefined,
          categoryIds: Array.isArray(v.categoryIds) ? v.categoryIds : undefined,
          hasDocuments: v.documentsSubmitted === true || files.length > 0 || Object.keys(legacyUrls).length > 0,
          rejectReason: typeof v.rejectReason === 'string' ? v.rejectReason : undefined,
          files,
          legacyUrls,
        };
      })
      .sort((a, b) => b.submittedAt - a.submittedAt);
    cb(items);
  });
}

/** Older requests kept their photos in Storage as plain URLs. */
function legacyPhotoUrls(v: Record<string, any>): Record<string, string> {
  const urls: Record<string, string> = {};
  if (v.idFrontUrl) urls.idFront = v.idFrontUrl;
  if (v.idBackUrl) urls.idBack = v.idBackUrl;
  if (v.selfieUrl) urls.selfie = v.selfieUrl;
  (Array.isArray(v.certificateUrls) ? v.certificateUrls : []).forEach((u: string, i: number) => {
    if (u) urls[`certificate-${i + 1}`] = u;
  });
  return urls;
}

export interface VerificationPhoto {
  /** idFront | idBack | selfie | certificate-N */
  name: string;
  /** A data URL (or a Storage URL on older requests). */
  url: string;
}

/** The artisan's document photos, in the order they were sent. */
export async function loadVerificationPhotos(item: VerificationItem): Promise<VerificationPhoto[]> {
  const db = getDb();
  const legacy = Object.entries(item.legacyUrls ?? {}).map(([name, url]) => ({ name, url }));
  if (!db || !isLive() || !item.files?.length) return legacy;
  const snap = await getDocs(collection(db, VERIFICATION_COLLECTION, item.id, VERIFICATION_FILES));
  const byName = new Map(snap.docs.map((d) => [d.id, d.data().dataUrl as string]));
  // Only the photos of the latest submission (older extras may linger).
  const photos = item.files.filter((n) => byName.get(n)).map((name) => ({ name, url: byName.get(name)! }));
  return [...photos, ...legacy.filter((l) => !item.files!.includes(l.name))];
}

/**
 * Persists an approve/reject decision. Updates the request, and reflects the
 * result on the artisan's user + profile records so the mobile badge updates.
 */
export async function decideVerification(item: VerificationItem, status: Decision, reason?: string): Promise<boolean> {
  const db = getDb();
  if (!db || !isLive()) return false;

  // The artisan is notified (Cloud Function onVerificationUpdated), with the
  // reason when it is a rejection, and sees it on their Verification page.
  await updateDoc(doc(db, VERIFICATION_COLLECTION, item.id), {
    status,
    rejectReason: status === 'rejected' ? (reason ?? '').trim().slice(0, 300) || null : null,
    reviewedAt: serverTimestamp(),
  });
  // The account's own status (active / suspended) is the Users page's business.
  await Promise.all([
    updateDoc(doc(db, 'users', item.artisanId), {
      verified: status === 'approved',
      updatedAt: serverTimestamp(),
    }).catch(() => {}),
    updateDoc(doc(db, 'artisanProfiles', item.artisanId), {
      verificationStatus: status,
    }).catch(() => {}),
  ]);
  return true;
}
