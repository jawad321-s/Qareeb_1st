// "Delete my account" in the app (callable `deleteMyAccount`): the signed-in
// user removes their own account for good. The app asks for their password
// first, so the sign-in must be recent. Refused while a job is in progress, so
// nobody is left half-way. Open requests are cancelled (the artisans who
// offered are told) and open offers withdrawn; the login, the profile, the
// notifications and the user's photos go. Finished requests, reviews and
// complaints stay for the records.
import { HttpsError } from 'firebase-functions/v2/https';

const ACTIVE_JOB = ['ACCEPTED', 'ON_THE_WAY', 'WORKING'];
const RECENT_LOGIN_S = 10 * 60;

/**
 * @param caller  { uid, authTime } from the callable's token, or null
 * @param bucket  () => Storage bucket, for the user's photos (failures ignored)
 */
export async function deleteOwnAccount(db, auth, bucket, caller, now = Date.now()) {
  if (!caller?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  if (!caller.authTime || now / 1000 - caller.authTime > RECENT_LOGIN_S) throw new HttpsError('failed-precondition', 'recent-login');
  return deleteAccount(db, auth, bucket, caller.uid);
}

export async function deleteAccount(db, auth, bucket, uid) {
  const [asCustomer, asArtisan] = await Promise.all([
    db.collection('requests').where('customerId', '==', uid).where('status', 'in', ACTIVE_JOB).limit(1).get(),
    db.collection('requests').where('acceptedArtisanId', '==', uid).where('status', 'in', ACTIVE_JOB).limit(1).get(),
  ]);
  if (!asCustomer.empty || !asArtisan.empty) throw new HttpsError('failed-precondition', 'active-jobs');

  const now = Date.now();
  const pending = await db.collection('requests').where('customerId', '==', uid).where('status', '==', 'PENDING').get();
  for (const r of pending.docs) {
    const offers = await db.collection('offers').where('requestId', '==', r.id).where('status', '==', 'PENDING').get();
    const batch = db.batch();
    offers.docs.forEach((o) => batch.update(o.ref, { status: 'REJECTED', requestStatus: 'CANCELLED', closedReason: 'REQUEST_CANCELLED' }));
    batch.update(r.ref, { status: 'CANCELLED', cancelledBy: uid, cancelChoice: null, cancelNote: null, cancelledAt: now, updatedAt: now });
    await batch.commit();
  }
  const open = await db.collection('offers').where('artisanId', '==', uid).where('status', '==', 'PENDING').get();
  if (!open.empty) {
    const batch = db.batch();
    open.docs.forEach((d) => batch.update(d.ref, { status: 'WITHDRAWN', updatedAt: now }));
    await batch.commit();
  }

  await auth.deleteUser(uid).catch((e) => {
    if (e?.code !== 'auth/user-not-found') throw e;
  });
  await db.recursiveDelete(db.collection('users').doc(uid));
  await db.recursiveDelete(db.collection('verificationRequests').doc(uid));
  await Promise.all([db.collection('artisanProfiles').doc(uid).delete(), db.collection('publicProfiles').doc(uid).delete()]);
  try {
    await bucket().deleteFiles({ prefix: `users/${uid}/` });
  } catch {
    // Storage unavailable: the account is gone anyway.
  }
  return { ok: true, cancelledRequests: pending.size, withdrawnOffers: open.size };
}
