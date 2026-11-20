// Deleted accounts are kept, marked "deleted" (a soft delete).
//
// "Delete my account" in the app (callable `deleteMyAccount`): the app asks
// for the password first, so the sign-in must be recent. Refused while a job
// is in progress, so nobody is left half-way. Open requests are cancelled (the
// artisans who offered are told) and open offers withdrawn. Then:
//   • users/{uid} stays, with status "deleted" (shown so in the dashboard);
//     requests, reviews, complaints, the support chat and photos stay too;
//   • the login is switched off and its phone address given up, so the same
//     number can sign up again later, as a brand-new account;
//   • the account leaves the artisan lists and the dispatch, and its push
//     tokens go (that phone may sign in to another account).
//
// An account deleted in the Firebase console is marked the same way: at once
// by the Auth trigger, and by an hourly sweep for any the trigger missed (or
// deleted before it existed). A suspended account can't delete itself.
import { HttpsError } from 'firebase-functions/v2/https';

const ACTIVE_JOB = ['ACCEPTED', 'ON_THE_WAY', 'WORKING'];
const RECENT_LOGIN_S = 10 * 60;
const LOGIN_DOMAIN = 'phone.qareeb.app';
const SWEEP_EVERY_MS = 60 * 60 * 1000;

/** Auth errors for an account whose login is already gone are not failures here. */
const ignoreMissing = (e) => {
  if (e?.code !== 'auth/user-not-found') throw e;
};

/**
 * @param caller  { uid, authTime, suspended } from the callable's token, or null
 */
export async function deleteOwnAccount(db, auth, caller, now = Date.now()) {
  if (!caller?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  if (!caller.authTime || now / 1000 - caller.authTime > RECENT_LOGIN_S) throw new HttpsError('failed-precondition', 'recent-login');
  // A suspended account talks to the team first; it can't erase itself.
  if (caller.suspended) throw new HttpsError('failed-precondition', 'suspended');
  return deleteAccount(db, auth, caller.uid);
}

export async function deleteAccount(db, auth, uid, by = 'self') {
  const [asCustomer, asArtisan] = await Promise.all([
    db.collection('requests').where('customerId', '==', uid).where('status', 'in', ACTIVE_JOB).limit(1).get(),
    db.collection('requests').where('acceptedArtisanId', '==', uid).where('status', 'in', ACTIVE_JOB).limit(1).get(),
  ]);
  if (!asCustomer.empty || !asArtisan.empty) throw new HttpsError('failed-precondition', 'active-jobs');

  const closed = await closeOpenWork(db, uid);
  await retireLogin(auth, uid);
  await markDeleted(db, uid, by);
  return { ok: true, ...closed };
}

/** Requests still waiting are cancelled (offers on them closed); the account's own open offers are withdrawn. */
async function closeOpenWork(db, uid) {
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
  return { cancelledRequests: pending.size, withdrawnOffers: open.size };
}

/**
 * The login is kept but switched off, and moved to an address of its own: the
 * phone's sign-in address (`<role>-<phone>@…`) is free again for a new account.
 */
export async function retireLogin(auth, uid) {
  const user = await auth.getUser(uid).catch((e) => {
    ignoreMissing(e);
    return null;
  });
  if (!user) return;
  await auth.updateUser(uid, {
    disabled: true,
    email: `deleted-${uid}@${LOGIN_DOMAIN}`,
    ...(user.phoneNumber ? { phoneNumber: null } : {}),
  });
  await auth.revokeRefreshTokens(uid).catch(() => {});
}

/**
 * Marks users/{uid} deleted (kept, with when and how) and takes the account out
 * of what others see and of the dispatch. Does nothing to an account already
 * marked, or with no user document.
 *
 * @param by  'self' (from the app) or 'console' (login removed in Firebase)
 */
export async function markDeleted(db, uid, by, now = Date.now()) {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists || snap.get('status') === 'deleted') return false;
  await ref.update({
    status: 'deleted',
    statusBeforeDelete: snap.get('status') ?? 'active',
    deletedAt: now,
    deletedBy: by,
    updatedAt: now,
  });
  // That phone may sign in to another account: no more pushes for this one.
  await db.recursiveDelete(ref.collection('fcmTokens'));
  const artisan = db.collection('artisanProfiles').doc(uid);
  if ((await artisan.get()).exists) await artisan.update({ available: false, deleted: true });
  const pub = db.collection('publicProfiles').doc(uid);
  if ((await pub.get()).exists) await pub.update({ deleted: true });
  return true;
}

/** The login was removed in the Firebase console (Auth trigger). */
export async function onLoginDeleted(db, uid) {
  if (!(await markDeleted(db, uid, 'console'))) return false;
  await closeOpenWork(db, uid);
  return true;
}

/**
 * At most hourly (from dispatchTick): accounts whose login no longer exists are
 * marked deleted — logins removed in the console before the trigger existed, or
 * while it was down. Demo accounts ("seed_…") have no login and are left alone.
 */
export async function sweepDeletedLogins(db, auth, now = Date.now()) {
  const marker = db.collection('meta').doc('deletedLoginSweep');
  const last = (await marker.get()).get('at') ?? 0;
  if (now - last < SWEEP_EVERY_MS) return null;
  await marker.set({ at: now });

  const users = await db.collection('users').select('status').get();
  const ids = users.docs.filter((d) => d.get('status') !== 'deleted' && !d.id.startsWith('seed_')).map((d) => d.id);
  let marked = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const { notFound } = await auth.getUsers(ids.slice(i, i + 100).map((uid) => ({ uid })));
    for (const missing of notFound) if (await onLoginDeleted(db, missing.uid)) marked += 1;
  }
  await marker.set({ at: now, checked: ids.length, marked });
  return marked;
}
