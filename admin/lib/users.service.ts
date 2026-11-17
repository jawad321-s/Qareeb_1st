// The dashboard's user management, done by the `adminManageUser` Cloud
// Function (firebase/functions/src/adminUsers.js): only it can mark a login as
// suspended (the app is then closed to it, except the support chat). Accounts
// are suspended, never deleted, and passwords are the users' own business
// (changed in the app). Demo mode only pretends.
'use client';

import { httpsCallable } from 'firebase/functions';
import { getFunctionsClient, isLive } from './firebase';

export type UserAction = 'suspend' | 'reactivate' | 'verify' | 'unverify';

/** Why an action failed, as a key of the users.err.* messages. */
export type UserActionError = 'denied' | 'unreachable' | 'generic';

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
    // A function that isn't deployed answers 404 without CORS headers, which
    // the browser reports as "internal"; offline is "unavailable".
    if (['functions/internal', 'functions/not-found', 'functions/unavailable', 'functions/deadline-exceeded'].includes(code)) {
      throw new UserActionFailed('unreachable');
    }
    throw new UserActionFailed('generic');
  }
}
