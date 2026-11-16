// The dashboard's user management, done by the `adminManageUser` Cloud
// Function (firebase/functions/src/adminUsers.js): only it can disable a
// login or set a password. Accounts are suspended, never deleted. Demo mode
// only pretends.
'use client';

import { httpsCallable } from 'firebase/functions';
import { getFunctionsClient, isLive } from './firebase';

export type UserAction = 'suspend' | 'reactivate' | 'verify' | 'unverify' | 'setPassword';
export const PASSWORD_MIN = 6;

/** Why an action failed, as a key of the users.err.* messages. */
export type UserActionError = 'weakPassword' | 'noLogin' | 'denied' | 'unreachable' | 'generic';

export class UserActionFailed extends Error {
  constructor(public reason: UserActionError) {
    super(reason);
  }
}

export async function manageUser(action: UserAction, uid: string, extra: { reason?: string; password?: string } = {}): Promise<void> {
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
    if (message === 'weak-password') throw new UserActionFailed('weakPassword');
    if (message === 'no-login') throw new UserActionFailed('noLogin');
    if (code === 'functions/permission-denied' || code === 'functions/unauthenticated') throw new UserActionFailed('denied');
    // A function that isn't deployed answers 404 without CORS headers, which
    // the browser reports as "internal"; offline is "unavailable".
    if (['functions/internal', 'functions/not-found', 'functions/unavailable', 'functions/deadline-exceeded'].includes(code)) {
      throw new UserActionFailed('unreachable');
    }
    throw new UserActionFailed('generic');
  }
}
