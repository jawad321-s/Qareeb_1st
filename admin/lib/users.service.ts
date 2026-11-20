// The dashboard's user management, done by the `adminManageUser` Cloud
// Function (firebase/functions/src/adminUsers.js): only it can mark a login as
// suspended (the app is then closed to it, except the support chat). Accounts
// are suspended, never deleted, and passwords are the users' own business
// (changed in the app). Suspending needs the admin's password again
// (confirmAdminPassword just before; the function checks the sign-in is that
// recent). Accounts their owners deleted are kept, read-only. Demo mode only
// pretends.
'use client';

import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { getAuthClient, getFunctionsClient, isLive } from './firebase';

export type UserAction = 'suspend' | 'reactivate' | 'verify' | 'unverify';

/** Why an action failed, as a key of the users.err.* messages. */
export type UserActionError = 'denied' | 'unreachable' | 'generic' | 'wrongPassword' | 'tooMany' | 'recentLogin' | 'deleted';

export class UserActionFailed extends Error {
  constructor(public reason: UserActionError) {
    super(reason);
  }
}

export async function manageUser(action: UserAction, uid: string, extra: { reason?: string } = {}): Promise<void> {
  const fns = getFunctionsClient();
  if (!isLive() || !fns) {
    await new Promise((r) => setTimeout(r, 400));
    return;
  }
  try {
    await httpsCallable(fns, 'adminManageUser')({ action, uid, ...extra });
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    const message = (e as { message?: string }).message ?? '';
    if (code === 'functions/permission-denied' || code === 'functions/unauthenticated') throw new UserActionFailed('denied');
    if (code === 'functions/failed-precondition' && message === 'recent-login') throw new UserActionFailed('recentLogin');
    if (code === 'functions/failed-precondition' && message === 'deleted') throw new UserActionFailed('deleted');
    // A function that isn't deployed answers 404 without CORS headers, which
    // the browser reports as "internal"; offline is "unavailable".
    if (['functions/internal', 'functions/not-found', 'functions/unavailable', 'functions/deadline-exceeded'].includes(code)) {
      throw new UserActionFailed('unreachable');
    }
    throw new UserActionFailed('generic');
  }
}

/**
 * The signed-in admin enters their password again (before suspending an
 * account). The fresh sign-in is what the server checks.
 */
export async function confirmAdminPassword(password: string): Promise<void> {
  if (!password) throw new UserActionFailed('wrongPassword');
  const user = getAuthClient()?.currentUser;
  if (!isLive() || !user) {
    await new Promise((r) => setTimeout(r, 300));
    return;
  }
  if (!user.email) throw new UserActionFailed('denied');
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    await user.getIdToken(true);
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(code)) {
      throw new UserActionFailed('wrongPassword');
    }
    if (code === 'auth/too-many-requests') throw new UserActionFailed('tooMany');
    if (code === 'auth/network-request-failed') throw new UserActionFailed('unreachable');
    throw new UserActionFailed('generic');
  }
}
