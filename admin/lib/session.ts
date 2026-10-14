// Client session for the admin console. Admins sign in with a phone number and
// password. With a Firebase project configured that is a real Firebase Auth
// sign-in, and only accounts whose users/{uid} role is 'admin' get in (the
// Firestore rules check the same); on mock data any valid number is accepted.
'use client';

import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getAdminAuth, getDb } from './firebase';
import { authIdFor, normalizePhone } from './phone';

const KEY = 'qareeb.admin.session';

export interface AdminSession {
  /** Admins sign in with their phone number, like every account on Qareeb. */
  phone: string;
  signedInAt: number;
}

export type SignInError = 'bad-credentials' | 'not-admin' | 'network' | 'unknown';

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

/** Signs in; throws an Error whose message is a SignInError. */
export async function signIn(phone: string, password: string): Promise<AdminSession> {
  const auth = getAdminAuth();
  if (auth) {
    const cred = await signInWithEmailAndPassword(auth, authIdFor(phone, 'admin'), password).catch((e) => {
      const code = String(e?.code ?? '');
      if (code === 'auth/network-request-failed') throw new Error('network');
      throw new Error(code.startsWith('auth/') ? 'bad-credentials' : 'unknown');
    });
    const profile = await getDoc(doc(getDb()!, 'users', cred.user.uid)).catch(() => null);
    if (profile?.data()?.role !== 'admin') {
      await firebaseSignOut(auth).catch(() => {});
      throw new Error('not-admin');
    }
  }
  const session: AdminSession = { phone: normalizePhone(phone), signedInAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(session));
  return session;
}

export function signOut() {
  localStorage.removeItem(KEY);
  const auth = getAdminAuth();
  if (auth) firebaseSignOut(auth).catch(() => {});
}
