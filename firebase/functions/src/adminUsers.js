// User management from the admin dashboard (callable `adminManageUser`), so
// the team never has to open the Firebase console: suspend / reactivate an
// account, verify an artisan or take it back. Accounts are suspended, never
// deleted, and passwords are changed by their owners in the app. Only callers
// whose token carries role=admin may use it, and every action is recorded in
// `adminLog`.
import { HttpsError } from 'firebase-functions/v2/https';

export const ACTIONS = ['suspend', 'reactivate', 'verify', 'unverify'];

/** Auth errors for an account that only exists in Firestore are not failures here. */
const ignoreMissing = (e) => {
  if (e?.code !== 'auth/user-not-found') throw e;
};

/**
 * @param db      Firestore (admin)
 * @param auth    Auth (admin)
 * @param caller  { uid, role, email } from the callable's token, or null
 * @param data    { action, uid, reason? }
 */
export async function manageUser(db, auth, caller, data) {
  if (!caller || caller.role !== 'admin') throw new HttpsError('permission-denied', 'Admins only.');
  const { action, uid } = data ?? {};
  if (!ACTIONS.includes(action)) throw new HttpsError('invalid-argument', 'Unknown action.');
  if (typeof uid !== 'string' || !uid || uid.includes('/')) throw new HttpsError('invalid-argument', 'A user id is required.');
  if (uid === caller.uid) throw new HttpsError('failed-precondition', 'self');

  const userRef = db.collection('users').doc(uid);
  const user = await userRef.get();
  if (!user.exists) throw new HttpsError('not-found', 'No such user.');
  const role = user.get('role');
  const now = Date.now();
  let result = {};

  switch (action) {
    case 'suspend': {
      await auth.updateUser(uid, { disabled: true }).catch(ignoreMissing);
      // Signs the account out on every device within the hour; the app's own
      // watcher on users/{uid}.status signs it out at once.
      await auth.revokeRefreshTokens(uid).catch(ignoreMissing);
      const reason = typeof data.reason === 'string' ? data.reason.trim().slice(0, 300) : '';
      await userRef.update({ status: 'suspended', suspendedAt: now, suspendReason: reason || null, updatedAt: now });
      result = { withdrawnOffers: await withdrawPendingOffers(db, uid) };
      break;
    }
    case 'reactivate':
      await auth.updateUser(uid, { disabled: false }).catch(ignoreMissing);
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
      if ((await request.get()).exists) await request.update({ status: approved ? 'approved' : 'rejected', reviewedAt: now });
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

/** An artisan's offers still waiting for an answer are taken back. */
async function withdrawPendingOffers(db, artisanId) {
  const open = await db.collection('offers').where('artisanId', '==', artisanId).where('status', '==', 'PENDING').get();
  if (open.empty) return 0;
  const batch = db.batch();
  open.docs.forEach((d) => batch.update(d.ref, { status: 'WITHDRAWN', updatedAt: Date.now() }));
  await batch.commit();
  return open.size;
}

