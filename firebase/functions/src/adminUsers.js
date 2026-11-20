// User management from the admin dashboard (callable `adminManageUser`), so
// the team never has to open the Firebase console: suspend / reactivate an
// account, verify an artisan or take it back. Accounts are suspended, never
// deleted, and passwords are changed by their owners in the app. Only callers
// whose token carries role=admin may use it, and every action is recorded in
// `adminLog`.
//
// A suspended account can still sign in, but only to the "account suspended"
// screen and its chat with the Qareeb team: the `suspended` claim on its token
// makes the security rules refuse everything else.
//
// Suspending needs the admin's password again: the dashboard re-checks it just
// before, and the sign-in on the token must be that recent. An account its
// owner deleted (status "deleted") is only kept for the records: no actions.
import { HttpsError } from 'firebase-functions/v2/https';

export const ACTIONS = ['suspend', 'reactivate', 'verify', 'unverify'];

/** How long ago the admin may have entered their password to suspend an account. */
const RECENT_LOGIN_S = 5 * 60;

/** Auth errors for an account that only exists in Firestore are not failures here. */
const ignoreMissing = (e) => {
  if (e?.code !== 'auth/user-not-found') throw e;
};

/**
 * @param db      Firestore (admin)
 * @param auth    Auth (admin)
 * @param caller  { uid, role, email, authTime } from the callable's token, or null
 * @param data    { action, uid, reason? }
 */
export async function manageUser(db, auth, caller, data, now = Date.now()) {
  if (!caller || caller.role !== 'admin') throw new HttpsError('permission-denied', 'Admins only.');
  const { action, uid } = data ?? {};
  if (!ACTIONS.includes(action)) throw new HttpsError('invalid-argument', 'Unknown action.');
  if (typeof uid !== 'string' || !uid || uid.includes('/')) throw new HttpsError('invalid-argument', 'A user id is required.');
  if (uid === caller.uid) throw new HttpsError('failed-precondition', 'self');
  if (action === 'suspend' && (!caller.authTime || now / 1000 - caller.authTime > RECENT_LOGIN_S)) {
    throw new HttpsError('failed-precondition', 'recent-login');
  }

  const userRef = db.collection('users').doc(uid);
  const user = await userRef.get();
  if (!user.exists) throw new HttpsError('not-found', 'No such user.');
  if (user.get('status') === 'deleted') throw new HttpsError('failed-precondition', 'deleted');
  const role = user.get('role');
  let result = {};

  switch (action) {
    case 'suspend': {
      // The app sees users/{uid}.status change at once and moves to the
      // suspended screen with a fresh token that carries the claim.
      await setSuspended(auth, uid, true);
      const reason = typeof data.reason === 'string' ? data.reason.trim().slice(0, 300) : '';
      await userRef.update({ status: 'suspended', suspendedAt: now, suspendReason: reason || null, updatedAt: now });
      result = { withdrawnOffers: await withdrawPendingOffers(db, uid) };
      break;
    }
    case 'reactivate':
      await setSuspended(auth, uid, false);
      await userRef.update({ status: 'active', suspendedAt: null, suspendReason: null, updatedAt: now });
      break;
    case 'verify':
    case 'unverify': {
      if (role !== 'artisan') throw new HttpsError('failed-precondition', 'not-artisan');
      const approved = action === 'verify';
      await userRef.update({ verified: approved, updatedAt: now });
      const profile = db.collection('artisanProfiles').doc(uid);
      if ((await profile.get()).exists) await profile.update({ verificationStatus: approved ? 'approved' : 'rejected' });
      const request = db.collection('verificationRequests').doc(uid);
      if ((await request.get()).exists) await request.update({ status: approved ? 'approved' : 'rejected', rejectReason: null, reviewedAt: now });
      break;
    }
  }

  await db.collection('adminLog').add({
    action,
    uid,
    name: user.get('fullName') ?? null,
    role: role ?? null,
    by: caller.uid,
    byEmail: caller.email ?? null,
    at: now,
    ...(action === 'suspend' && data.reason ? { reason: String(data.reason).slice(0, 300) } : {}),
  });
  return { ok: true, action, uid, ...result };
}

/**
 * Adds or removes the `suspended` claim (other claims are kept). Suspensions
 * before the support chat disabled the login instead, so it is enabled again.
 */
export async function setSuspended(auth, uid, suspended) {
  const user = await auth.getUser(uid).catch((e) => {
    ignoreMissing(e);
    return null;
  });
  if (!user) return;
  const { suspended: _was, ...claims } = user.customClaims ?? {};
  await auth.setCustomUserClaims(uid, suspended ? { ...claims, suspended: true } : claims);
  if (user.disabled) await auth.updateUser(uid, { disabled: false });
}

/**
 * Once: accounts suspended the old way (login disabled) get the claim and can
 * sign in to reach support. A marker in meta/suspendedLogin makes it run once.
 */
export async function migrateSuspendedLogins(db, auth) {
  const marker = db.collection('meta').doc('suspendedLogin');
  if ((await marker.get()).exists) return null;
  const suspended = await db.collection('users').where('status', '==', 'suspended').get();
  for (const d of suspended.docs) await setSuspended(auth, d.id, true);
  await marker.set({ at: Date.now(), accounts: suspended.size });
  return suspended.size;
}

/** An artisan's offers still waiting for an answer are taken back. */
async function withdrawPendingOffers(db, artisanId) {
  const open = await db.collection('offers').where('artisanId', '==', artisanId).where('status', '==', 'PENDING').get();
  if (open.empty) return 0;
  const batch = db.batch();
  open.docs.forEach((d) => batch.update(d.ref, { status: 'WITHDRAWN', updatedAt: Date.now() }));
  await batch.commit();
  return open.size;
}

