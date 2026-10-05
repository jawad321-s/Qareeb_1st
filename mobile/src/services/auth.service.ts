// Firebase Auth for the live backend. Users sign in with phone + password:
// each phone number maps to an internal email-style login on Firebase's
// Email/Password provider, so no SMS is needed and it works in Expo Go.
// The user's real email stays on their profile (users/{uid}.email).
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuthClient, getDb } from '@/lib/firebase';
import type { AppUser, UserRole } from '@/types';

const LOGIN_DOMAIN = 'phone.qareeb.app';

/**
 * Normalises local and international forms of the same number to one key:
 * 0599123456, +970599123456, 00972599123456 → 599123456.
 */
export function normalizePhone(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('970') || d.startsWith('972')) d = d.slice(3);
  return d.replace(/^0+/, '');
}

const loginEmail = (phone: string) => `p${normalizePhone(phone)}@${LOGIN_DOMAIN}`;

/** Thrown with a translation key so screens can show a localised message. */
export class AuthError extends Error {
  constructor(public key: AuthErrorKey) {
    super(key);
  }
}
export type AuthErrorKey =
  | 'auth.errInvalidCredentials'
  | 'auth.errPhoneInUse'
  | 'auth.errWrongRole'
  | 'auth.errNetwork'
  | 'auth.errTooMany'
  | 'auth.errGeneric';

function toAuthError(err: unknown): AuthError {
  if (err instanceof AuthError) return err;
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return new AuthError('auth.errInvalidCredentials');
    case 'auth/email-already-in-use':
      return new AuthError('auth.errPhoneInUse');
    case 'auth/network-request-failed':
      return new AuthError('auth.errNetwork');
    case 'auth/too-many-requests':
      return new AuthError('auth.errTooMany');
    default:
      return new AuthError('auth.errGeneric');
  }
}

const auth = () => {
  const a = getAuthClient();
  if (!a) throw new Error('Firebase Auth is not configured');
  return a;
};
const db = () => {
  const d = getDb();
  if (!d) throw new Error('Firestore is not configured');
  return d;
};

export async function loadProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  if (!snap.exists()) return null;
  return { ...(snap.data() as AppUser), uid: snap.id };
}

export async function signInWithPhone(phone: string, password: string, role: UserRole): Promise<AppUser> {
  try {
    const { user } = await signInWithEmailAndPassword(auth(), loginEmail(phone), password);
    const profile = await loadProfile(user.uid);
    if (!profile) throw new AuthError('auth.errInvalidCredentials');
    // Customer and artisan accounts each have their own sign-in entry.
    if (profile.role !== role) {
      await fbSignOut(auth());
      throw new AuthError('auth.errWrongRole');
    }
    return profile;
  } catch (err) {
    throw toAuthError(err);
  }
}

export interface RegisterParams {
  role: 'customer' | 'artisan';
  fullName: string;
  email: string;
  phone: string;
  password: string;
  locale: AppUser['locale'];
  artisan?: { categoryIds: string[]; experienceYears?: number; bio?: string };
}

export async function registerWithPhone(p: RegisterParams): Promise<AppUser> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth(), loginEmail(p.phone), p.password);
    await updateProfile(user, { displayName: p.fullName }).catch(() => {});

    const now = Date.now();
    const profile: AppUser = {
      uid: user.uid,
      role: p.role,
      fullName: p.fullName.trim(),
      email: p.email.trim(),
      phone: p.phone.trim(),
      locale: p.locale,
      status: 'active',
      verified: false,
      rating: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db(), 'users', user.uid), profile);

    if (p.role === 'artisan' && p.artisan) {
      await setDoc(doc(db(), 'artisanProfiles', user.uid), {
        uid: user.uid,
        bio: p.artisan.bio ?? '',
        experienceYears: p.artisan.experienceYears ?? 0,
        categoryIds: p.artisan.categoryIds,
        serviceIds: [],
        availability: { days: [0, 1, 2, 3, 4, 5, 6], from: '08:00', to: '20:00' },
        gallery: [],
        certificates: [],
        verificationStatus: 'unsubmitted',
        premium: false,
        completedJobs: 0,
        rating: 0,
        ratingCount: 0,
      });
    }
    return profile;
  } catch (err) {
    throw toAuthError(err);
  }
}

/** Persists self-editable profile fields (role/status/verified are server-owned). */
export async function saveProfile(uid: string, patch: Partial<AppUser>): Promise<void> {
  const { role: _r, status: _s, verified: _v, uid: _u, ...editable } = patch;
  if (Object.keys(editable).length === 0) return;
  await updateDoc(doc(db(), 'users', uid), { ...editable, updatedAt: Date.now() });
}

export async function signOutFirebase(): Promise<void> {
  const a = getAuthClient();
  if (a) await fbSignOut(a);
}
