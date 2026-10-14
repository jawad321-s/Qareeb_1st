// Client session for the admin console. Admins sign in with their phone
// number, like every account on Qareeb.
//  • Live: Firebase Auth. The number maps to an internal sign-in address
//    (admin-<number>@phone.qareeb.app, as the mobile app does for customers
//    and artisans), and only accounts carrying the `role: "admin"` custom
//    claim get in. Create one with `npm run create-admin -- <phone> <password>`
//    inside firebase/.
//  • Mock: a local demo session, so the dashboard runs without a backend.
'use client';

import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, type User } from 'firebase/auth';
import { getAuthClient } from './firebase';
import { nationalNumber, normalizePhone } from './phone';

const LOGIN_DOMAIN = 'phone.qareeb.app';
const loginEmail = (phone: string) => `admin-${nationalNumber(phone)}@${LOGIN_DOMAIN}`;
/** admin-599123456@phone.qareeb.app → +970599123456 */
const phoneOf = (email: string | null) => normalizePhone(email?.match(/^admin-(\d+)@/)?.[1] ?? '');

const KEY = 'qareeb.admin.session';

export interface AdminSession {
  /** Admins sign in with their phone number, like every account on Qareeb. */
  phone: string;
  signedInAt: number;
}

export type SignInErrorCode = 'invalid' | 'notAdmin' | 'network' | 'tooMany' | 'generic';

export class SignInError extends Error {
  /** `detail` carries the raw Firebase error code for diagnosis. */
  constructor(public code: SignInErrorCode, public detail?: string) {
    super(code);
  }
}

function readLocal(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function writeLocal(phone: string): AdminSession {
  const session: AdminSession = { phone, signedInAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

async function isAdmin(user: User): Promise<boolean> {
  // Force-refresh so a freshly granted claim is picked up.
  const token = await user.getIdTokenResult(true);
  return token.claims.role === 'admin';
}

/** Resolves the current admin session (waits for Firebase to restore it when live). */
export function waitForSession(): Promise<AdminSession | null> {
  const auth = getAuthClient();
  if (!auth) return Promise.resolve(readLocal());
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) return resolve(null);
      try {
        resolve((await isAdmin(user)) ? writeLocal(phoneOf(user.email)) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

export async function signIn(phone: string, password: string): Promise<AdminSession> {
  const auth = getAuthClient();
  if (!auth) return writeLocal(normalizePhone(phone));
  try {
    const { user } = await signInWithEmailAndPassword(auth, loginEmail(phone), password);
    if (!(await isAdmin(user))) {
      await fbSignOut(auth);
      throw new SignInError('notAdmin');
    }
    return writeLocal(normalizePhone(phone));
  } catch (err) {
    if (err instanceof SignInError) throw err;
    const code = (err as { code?: string })?.code ?? '';
    if (['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) {
      throw new SignInError('invalid');
    }
    if (code === 'auth/network-request-failed') throw new SignInError('network');
    if (code === 'auth/too-many-requests') throw new SignInError('tooMany');
    console.error('[admin sign-in]', err);
    throw new SignInError('generic', code || (err as Error)?.message);
  }
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(KEY);
  const auth = getAuthClient();
  if (auth) await fbSignOut(auth).catch(() => {});
}
