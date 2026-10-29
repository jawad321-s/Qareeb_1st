// Client session for the admin console. Admins sign in with an email and a
// password.
//  • Live: Firebase Auth (Email/Password), and only accounts carrying the
//    `role: "admin"` custom claim get in. Create one with
//    `node scripts/create-admin.mjs <email> <password>` inside firebase/.
//  • Mock: a local demo session, so the dashboard runs without a backend.
'use client';

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { getAuthClient } from './firebase';

const KEY = 'qareeb.admin.session';

export interface AdminSession {
  email: string;
  signedInAt: number;
}

export type SignInErrorCode = 'invalid' | 'notAdmin' | 'network' | 'tooMany' | 'generic';

export class SignInError extends Error {
  /** `detail` carries the raw Firebase error code for diagnosis. */
  constructor(public code: SignInErrorCode, public detail?: string) {
    super(code);
  }
}

/** Loose shape check; Firebase has the final word. */
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const normalizeEmail = (email: string) => email.trim().toLowerCase();

function readLocal(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function writeLocal(email: string): AdminSession {
  const session: AdminSession = { email, signedInAt: Date.now() };
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
        resolve((await isAdmin(user)) ? writeLocal(user.email ?? '') : null);
      } catch {
        resolve(null);
      }
    });
  });
}

function toSignInError(err: unknown): SignInError {
  if (err instanceof SignInError) return err;
  const code = (err as { code?: string })?.code ?? '';
  if (['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) {
    return new SignInError('invalid');
  }
  if (code === 'auth/network-request-failed') return new SignInError('network');
  if (code === 'auth/too-many-requests') return new SignInError('tooMany');
  console.error('[admin auth]', err);
  return new SignInError('generic', code || (err as Error)?.message);
}

export async function signIn(email: string, password: string): Promise<AdminSession> {
  const auth = getAuthClient();
  if (!auth) return writeLocal(normalizeEmail(email));
  try {
    const { user } = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    if (!(await isAdmin(user))) {
      await fbSignOut(auth);
      throw new SignInError('notAdmin');
    }
    return writeLocal(user.email ?? normalizeEmail(email));
  } catch (err) {
    throw toSignInError(err);
  }
}

/**
 * Emails a password-reset link (Firebase's own email, no Blaze needed). With
 * email enumeration protection on, Firebase answers the same way whether or
 * not the address has an account.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getAuthClient();
  if (!auth) return;
  try {
    await sendPasswordResetEmail(auth, normalizeEmail(email));
  } catch (err) {
    throw toSignInError(err);
  }
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(KEY);
  const auth = getAuthClient();
  if (auth) await fbSignOut(auth).catch(() => {});
}
