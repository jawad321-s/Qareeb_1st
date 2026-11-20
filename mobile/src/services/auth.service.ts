// Firebase Auth for the live backend. Users sign in with phone + password:
// each phone number maps to an internal email-style login on Firebase's
// Email/Password provider, so no SMS is needed and it works in Expo Go.
// The login is per role, so one phone number can hold both a customer and an
// artisan account (separate uids, profiles and passwords). The phone number is
// the only account identity; the internal address is never shown.
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getAuthClient, getDb, getFunctionsClient } from '@/lib/firebase';
import { nationalNumber, normalizePhone } from '@/lib/phone';
import { openVerificationRequest } from './verification.service';
import type { AppUser, UserRole } from '@/types';

const LOGIN_DOMAIN = 'phone.qareeb.app';

// Keyed by the national number so accounts created before numbers were
// stored as +970… keep signing in.
const loginEmail = (phone: string, role: UserRole) => `${role}-${nationalNumber(phone)}@${LOGIN_DOMAIN}`;

/** Thrown with a translation key so screens can show a localised message. */
export class AuthError extends Error {
  /** `detail` carries the raw Firebase error code for unexpected failures. */
  constructor(public key: AuthErrorKey, public detail?: string) {
    super(key);
  }
}

/** Localised message for a failed sign-in/sign-up, with the raw code when unexpected. */
export function authErrorMessage(err: unknown, t: (key: AuthErrorKey) => string): string {
  if (!(err instanceof AuthError)) return t('auth.errGeneric');
  return t(err.key) + (err.detail ? ` (${err.detail})` : '');
}
export type AuthErrorKey =
  | 'auth.errInvalidCredentials'
  | 'auth.errPhoneInUse'
  | 'auth.errWrongRole'
  | 'auth.errNetwork'
  | 'auth.errTooMany'
  | 'auth.errDisabled'
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
    // Suspended from the admin dashboard.
    case 'auth/user-disabled':
      return new AuthError('auth.errDisabled');
    default:
      console.warn('[auth]', err);
      return new AuthError('auth.errGeneric', code || (err as Error)?.message || 'unknown');
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
    const { user } = await signInWithEmailAndPassword(auth(), loginEmail(phone, role), password);
    const profile = await loadProfile(user.uid);
    if (!profile) throw new AuthError('auth.errInvalidCredentials');
    // Defensive: the login is role-scoped, so this only trips on bad data.
    if (profile.role !== role) {
      await fbSignOut(auth());
      throw new AuthError('auth.errWrongRole');
    }
    // A suspended account signs in to the "account suspended" screen only;
    // its token carries the claim that keeps everything else closed.
    return profile;
  } catch (err) {
    throw toAuthError(err);
  }
}

export interface RegisterParams {
  role: 'customer' | 'artisan';
  fullName: string;
  phone: string;
  /** Required on the live backend; the demo flow has no passwords. */
  password?: string;
  locale?: AppUser['locale'];
  artisan?: { categoryIds: string[]; experienceYears?: number; bio?: string };
}

export async function registerWithPhone(p: RegisterParams): Promise<AppUser> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth(), loginEmail(p.phone, p.role), p.password ?? '');
    await updateProfile(user, { displayName: p.fullName }).catch(() => {});

    const now = Date.now();
    const profile: AppUser = {
      uid: user.uid,
      role: p.role,
      fullName: p.fullName.trim(),
      phone: normalizePhone(p.phone),
      locale: p.locale ?? 'ar',
      status: 'active',
      verified: false,
      rating: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db(), 'users', user.uid), profile);
    // Visible to others right away (name, photo, rating — no contact details).
    await publishPublicProfile(profile).catch(() => {});

    if (p.role === 'artisan' && p.artisan) {
      await setDoc(doc(db(), 'artisanProfiles', user.uid), {
        uid: user.uid,
        bio: p.artisan.bio ?? '',
        experienceYears: p.artisan.experienceYears ?? 0,
        categoryIds: p.artisan.categoryIds,
        // One service per category, with the category's id.
        serviceIds: p.artisan.categoryIds,
        availability: { days: [0, 1, 2, 3, 4, 5, 6], from: '08:00', to: '20:00' },
        gallery: [],
        certificates: [],
        verificationStatus: 'unsubmitted',
        premium: false,
        completedJobs: 0,
        rating: 0,
        ratingCount: 0,
      });
      // Show up in the admin's verification queue immediately.
      await openVerificationRequest(profile, p.artisan.categoryIds).catch(() => {});
    }
    return profile;
  } catch (err) {
    throw toAuthError(err);
  }
}

/**
 * What other users may see of an account: publicProfiles/{uid}. The users doc
 * also holds the phone number and home location; for customers it is private
 * (see firestore.rules), so artisans read this instead.
 */
export async function publishPublicProfile(u: AppUser): Promise<void> {
  await setDoc(doc(db(), 'publicProfiles', u.uid), {
    uid: u.uid,
    role: u.role,
    fullName: u.fullName,
    ...(u.photoUrl ? { photoUrl: u.photoUrl } : {}),
    rating: u.rating ?? 0,
    ratingCount: u.ratingCount ?? 0,
    createdAt: u.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  });
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

// ---------------------------------------------------------------------------
// The signed-in user's own account: change the password, delete the account.
// Both ask for the current password first (Firebase wants a recent sign-in for
// these, and it stops someone else holding the phone from doing it).

export type AccountErrorKey =
  | 'cp.errWrong'
  | 'cp.errWeak'
  | 'del.errActiveJobs'
  | 'del.errUnreachable'
  | 'auth.errNetwork'
  | 'auth.errTooMany'
  | 'auth.errGeneric';

export class AccountError extends Error {
  constructor(public key: AccountErrorKey, public detail?: string) {
    super(key);
  }
}

function toAccountError(err: unknown): AccountError {
  if (err instanceof AccountError) return err;
  const code = (err as { code?: string })?.code ?? '';
  const message = (err as Error)?.message ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/missing-password':
      return new AccountError('cp.errWrong');
    case 'auth/weak-password':
      return new AccountError('cp.errWeak');
    case 'auth/network-request-failed':
      return new AccountError('auth.errNetwork');
    case 'auth/too-many-requests':
      return new AccountError('auth.errTooMany');
    // A job in progress: finish or cancel it first.
    case 'functions/failed-precondition':
      if (message === 'active-jobs') return new AccountError('del.errActiveJobs');
      break;
    // The function isn't deployed yet, or the server can't be reached.
    case 'functions/not-found':
    case 'functions/unavailable':
    case 'functions/internal':
    case 'functions/deadline-exceeded':
      return new AccountError('del.errUnreachable', code);
  }
  console.warn('[account]', err);
  return new AccountError('auth.errGeneric', code || message || 'unknown');
}

/** Proves the password again on the signed-in account. */
async function reauthenticate(password: string) {
  const user = auth().currentUser;
  if (!user?.email) throw new AccountError('auth.errGeneric', 'not-signed-in');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  return user;
}

/** Sets a new password after checking the current one. The next sign-in uses the new one. */
export async function changePassword(current: string, next: string): Promise<void> {
  try {
    const user = await reauthenticate(current);
    await updatePassword(user, next);
  } catch (err) {
    throw toAccountError(err);
  }
}

/**
 * Deletes the signed-in account (Cloud Function deleteMyAccount): the login is
 * switched off and the account kept in the records, marked deleted; the same
 * number can sign up again as a new account. Refused while a job is in
 * progress. The caller signs out locally afterwards.
 */
export async function deleteMyAccount(password: string): Promise<void> {
  try {
    await reauthenticate(password);
    const functions = getFunctionsClient();
    if (!functions) throw new AccountError('auth.errGeneric', 'functions');
    await httpsCallable(functions, 'deleteMyAccount')();
  } catch (err) {
    throw toAccountError(err);
  }
}
