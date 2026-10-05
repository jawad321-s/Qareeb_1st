// Client session for the admin console.
//  • Live: Firebase Auth (email/password). Only accounts carrying the
//    `role: "admin"` custom claim get in — grant it with
//    `npm run set-role -- <email> admin` inside firebase/.
//  • Mock: a local demo session, so the dashboard runs without a backend.
'use client';

import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, type User } from 'firebase/auth';
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

export async function signIn(email: string, password: string): Promise<AdminSession> {
  const auth = getAuthClient();
  if (!auth) return writeLocal(email);
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    if (!(await isAdmin(user))) {
      await fbSignOut(auth);
      throw new SignInError('notAdmin');
    }
    return writeLocal(user.email ?? email);
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
