// Verification service — the bridge between the mobile artisan app and the
// admin dashboard. When Firebase is configured, artisan submissions land in the
// `verificationRequests` collection that the admin reads in real time, and the
// admin's decision flows back here via a live snapshot. On mock, it's a no-op.
//
// The document photos are stored in Firestore, not Storage (which needs the
// Blaze plan): each photo is a compressed JPEG data URL in its own doc under
// verificationRequests/{uid}/files/{name}, readable only by the artisan and
// admins, and kept well under Firestore's 1 MiB document limit.
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { getDb, isLive } from '@/lib/firebase';
import type { AppUser, VerificationStatus } from '@/types';

export const VERIFICATION_COLLECTION = 'verificationRequests';
export const VERIFICATION_FILES = 'files';

export interface VerificationSubmission {
  user: AppUser;
  /** Fallbacks when the artisan profile doesn't have them (it normally does). */
  categoryIds: string[];
  experienceYears?: number;
  bio?: string;
  idFront: string;
  idBack: string;
  selfie?: string;
  certificates: string[];
}

// Longest side and JPEG quality per attempt; later attempts shrink further
// until the photo fits.
const ATTEMPTS = [
  { side: 1280, compress: 0.6 },
  { side: 1024, compress: 0.5 },
  { side: 800, compress: 0.4 },
];
const MAX_DATA_URL = 700_000;

/** A local photo → a compressed `data:image/jpeg;base64,…` URL. */
async function toDataUrl(uri: string): Promise<string> {
  const { width, height } = await ImageManipulator.manipulate(uri).renderAsync();
  for (const { side, compress } of ATTEMPTS) {
    let ctx = ImageManipulator.manipulate(uri);
    if (Math.max(width, height) > side) ctx = ctx.resize(width >= height ? { width: side } : { height: side });
    const image = await ctx.renderAsync();
    const { base64 } = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    if (dataUrl.length <= MAX_DATA_URL) return dataUrl;
  }
  throw new Error('image-too-large');
}

/**
 * Stores the artisan's document photos and puts a pending request with them in
 * the admin's queue. Throws if anything fails, so the screen can say so.
 */
export async function submitVerification(payload: VerificationSubmission): Promise<void> {
  const db = getDb();
  if (!db || !isLive()) return;

  const { user, idFront, idBack, selfie, certificates } = payload;
  const uid = user.uid;
  const photos: [string, string][] = [
    ['idFront', idFront],
    ['idBack', idBack],
    ...(selfie ? ([['selfie', selfie]] as [string, string][]) : []),
    ...certificates.map((uri, i): [string, string] => [`certificate-${i + 1}`, uri]),
  ];

  const files: string[] = [];
  for (const [name, uri] of photos) {
    const dataUrl = await toDataUrl(uri);
    await setDoc(doc(db, VERIFICATION_COLLECTION, uid, VERIFICATION_FILES, name), {
      name,
      dataUrl,
      uploadedAt: serverTimestamp(),
    });
    files.push(name);
  }

  // The artisan profile holds what was entered at sign-up.
  const profile = (await getDoc(doc(db, 'artisanProfiles', uid)).catch(() => null))?.data();
  const categoryIds: string[] = profile?.categoryIds?.length ? profile.categoryIds : payload.categoryIds;

  await setDoc(doc(db, VERIFICATION_COLLECTION, uid), {
    id: uid,
    artisanId: uid,
    name: user.fullName,
    phone: user.phone,
    categoryIds,
    category: categoryIds[0] ?? '',
    experienceYears: profile?.experienceYears ?? payload.experienceYears ?? null,
    bio: profile?.bio || payload.bio || null,
    status: 'pending' as VerificationStatus,
    documentsSubmitted: true,
    files,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
  });
}

/**
 * Puts a new artisan in the admin's verification queue (dashboard → Artisans)
 * right away, before any documents are uploaded. No-op if a request already
 * exists — submitVerification later adds the documents to the same record.
 */
export async function openVerificationRequest(
  user: Pick<AppUser, 'uid' | 'fullName' | 'phone'>,
  categoryIds: string[],
): Promise<void> {
  const db = getDb();
  if (!db || !isLive()) return;
  const ref = doc(db, VERIFICATION_COLLECTION, user.uid);
  const exists = await getDoc(ref).then((s) => s.exists()).catch(() => false);
  if (exists) return;
  await setDoc(ref, {
    id: user.uid,
    artisanId: user.uid,
    name: user.fullName,
    phone: user.phone,
    categoryIds,
    category: categoryIds[0] ?? '',
    status: 'pending' as VerificationStatus,
    documentsSubmitted: false,
    files: [],
    submittedAt: serverTimestamp(),
    reviewedAt: null,
  });
}

/**
 * Subscribes to the artisan's own verification status so the UI updates the
 * moment an admin approves or rejects. A request opened at sign-up without
 * documents reads as "unsubmitted", so the artisan can still send them.
 * Returns an unsubscribe function.
 */
export function watchVerificationStatus(
  uid: string,
  cb: (status: VerificationStatus) => void,
): () => void {
  const db = getDb();
  if (!db || !isLive()) return () => {};
  return onSnapshot(
    doc(db, VERIFICATION_COLLECTION, uid),
    (snap) => {
      const data = snap.data();
      if (!data?.status) return;
      const hasDocuments = data.documentsSubmitted === true || !!data.idFrontUrl;
      cb(data.status === 'pending' && !hasDocuments ? 'unsubmitted' : (data.status as VerificationStatus));
    },
    // Refused reads (e.g. signed out mid-listen) keep the status the app
    // already has instead of surfacing an uncaught listener error.
    () => {},
  );
}
