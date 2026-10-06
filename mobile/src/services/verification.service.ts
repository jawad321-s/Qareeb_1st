// Verification service — the bridge between the mobile artisan app and the
// admin dashboard. When Firebase is configured, artisan submissions land in the
// `verificationRequests` collection that the admin reads in real time, and the
// admin's decision flows back here via a live snapshot. On mock, it's a no-op.
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDb, getBucket, isLive } from '@/lib/firebase';
import type { AppUser, VerificationStatus } from '@/types';

export const VERIFICATION_COLLECTION = 'verificationRequests';

export interface VerificationSubmission {
  user: AppUser;
  categoryIds: string[];
  experienceYears?: number;
  bio?: string;
  idFront: string;
  idBack: string;
  selfie?: string;
  certificates: string[];
}

async function uploadOne(uid: string, name: string, uri: string): Promise<string> {
  const bucket = getBucket();
  if (!bucket) return uri;
  const blob = await (await fetch(uri)).blob();
  const path = ref(bucket, `verifications/${uid}/${name}`);
  await uploadBytes(path, blob);
  return getDownloadURL(path);
}

/**
 * Uploads the artisan's documents and writes a pending verification request.
 * Returns true when it actually hit Firestore (live), false on mock.
 */
export async function submitVerification(payload: VerificationSubmission): Promise<boolean> {
  const db = getDb();
  if (!db || !isLive()) return false;

  const { user, categoryIds, experienceYears, bio, idFront, idBack, selfie, certificates } = payload;
  const uid = user.uid;

  const [idFrontUrl, idBackUrl, selfieUrl] = await Promise.all([
    uploadOne(uid, 'id-front.jpg', idFront),
    uploadOne(uid, 'id-back.jpg', idBack),
    selfie ? uploadOne(uid, 'selfie.jpg', selfie) : Promise.resolve<string | undefined>(undefined),
  ]);
  const certificateUrls = await Promise.all(
    certificates.map((uri, i) => uploadOne(uid, `certificate-${i + 1}.jpg`, uri)),
  );

  await setDoc(doc(db, VERIFICATION_COLLECTION, uid), {
    id: uid,
    artisanId: uid,
    name: user.fullName,
    email: user.email,
    phone: user.phone,
    categoryIds,
    category: categoryIds[0] ?? '',
    experienceYears: experienceYears ?? null,
    bio: bio ?? null,
    status: 'pending' as VerificationStatus,
    idFrontUrl,
    idBackUrl,
    selfieUrl: selfieUrl ?? null,
    certificateUrls,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
  });

  // Reflect the pending state on the user profile the admin also sees.
  await updateDoc(doc(db, 'users', uid), { status: 'pending', updatedAt: serverTimestamp() }).catch(() => {});
  return true;
}

/**
 * Puts a new artisan in the admin's verification queue (dashboard → Artisans)
 * right away, before any documents are uploaded. No-op if a request already
 * exists — submitVerification later adds the documents to the same record.
 */
export async function openVerificationRequest(
  user: Pick<AppUser, 'uid' | 'fullName' | 'email' | 'phone'>,
  categoryIds: string[],
): Promise<void> {
  const db = getDb();
  if (!db || !isLive()) return;
  const ref = doc(db, VERIFICATION_COLLECTION, user.uid);
  // The rules deny reading a missing request, so an error means "none yet".
  const exists = await getDoc(ref).then((s) => s.exists()).catch(() => false);
  if (exists) return;
  await setDoc(ref, {
    id: user.uid,
    artisanId: user.uid,
    name: user.fullName,
    email: user.email,
    phone: user.phone,
    categoryIds,
    category: categoryIds[0] ?? '',
    status: 'pending' as VerificationStatus,
    idFrontUrl: null,
    idBackUrl: null,
    selfieUrl: null,
    certificateUrls: [],
    submittedAt: serverTimestamp(),
    reviewedAt: null,
  });
}

/**
 * Subscribes to the artisan's own verification status so the UI updates the
 * moment an admin approves or rejects. Returns an unsubscribe function.
 */
export function watchVerificationStatus(
  uid: string,
  cb: (status: VerificationStatus) => void,
): () => void {
  const db = getDb();
  if (!db || !isLive()) return () => {};
  return onSnapshot(doc(db, VERIFICATION_COLLECTION, uid), (snap) => {
    const data = snap.data();
    if (data?.status) cb(data.status as VerificationStatus);
  });
}
