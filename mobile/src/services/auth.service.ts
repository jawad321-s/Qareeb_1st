// Account sign-up and sign-in. Accounts are by phone number + password, and a
// number holds one customer and one separate artisan account. Same surface for
// the mock (accounts on this device) and Firebase (Firebase Auth + users/{uid}).
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb, getFirebaseAuth } from '@/lib/firebase';
import { mapUser } from '@/lib/firestoreMap';
import { authIdFor, normalizePhone } from '@/lib/phone';
import { MOCK_ARTISANS, MOCK_CUSTOMER, MOCK_PAST_CUSTOMERS } from '@/mock/data';
import { localAccounts } from '@/store/accounts';
import type { AppUser } from '@/types';

export type AccountRole = 'customer' | 'artisan';

export type AuthErrorCode = 'phone-taken' | 'bad-credentials' | 'no-profile' | 'demo-missing' | 'too-many' | 'network' | 'unknown';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}

export interface NewAccount {
  phone: string;
  password: string;
  fullName: string;
  role: AccountRole;
  /** Professional info from the artisan sign-up form. */
  artisan?: { categoryIds: string[]; experienceYears?: number; bio?: string };
}

/**
 * Password of the demo accounts the seed creates in Firebase (firebase/seed) —
 * the same numbers as the mock demo users. Demo data only.
 */
export const DEMO_PASSWORD = 'qareeb123';

const demoUser = (role: AccountRole) => (role === 'artisan' ? MOCK_ARTISANS[0] : MOCK_CUSTOMER);

interface AuthBackend {
  /** Creates the account and signs into it. Throws AuthError('phone-taken'). */
  createAccount(input: NewAccount): Promise<AppUser>;
  signIn(phone: string, password: string, role: AccountRole): Promise<AppUser>;
  signInDemo(role: AccountRole): Promise<AppUser>;
  signOut(): Promise<void>;
  /** Calls back with the signed-in account id (null when signed out). */
  watch(cb: (uid: string | null) => void): () => void;
}

// ── Mock: accounts kept on this device, backed by the role's demo data ──────
const mockAuth: AuthBackend = {
  async createAccount({ phone, fullName, role }) {
    await new Promise((r) => setTimeout(r, 500));
    const n = normalizePhone(phone);
    const demoTaken = [MOCK_CUSTOMER, ...MOCK_PAST_CUSTOMERS, ...MOCK_ARTISANS].some(
      (u) => u.role === role && normalizePhone(u.phone) === n,
    );
    if (demoTaken || localAccounts.get(n, role)) throw new AuthError('phone-taken');
    localAccounts.add(n, role, fullName);
    return { ...demoUser(role), fullName, phone: n, createdAt: Date.now(), updatedAt: Date.now() };
  },
  async signIn(phone, _password, role) {
    const base = demoUser(role);
    return { ...base, fullName: localAccounts.get(phone, role)?.fullName ?? base.fullName, phone: normalizePhone(phone) };
  },
  async signInDemo(role) {
    return { ...demoUser(role) };
  },
  async signOut() {},
  watch() {
    return () => {};
  },
};

// ── Firebase: Firebase Auth (password sign-in) + the users/{uid} profile ────
function toAuthError(e: unknown): AuthError {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use') return new AuthError('phone-taken');
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(code)) {
    return new AuthError('bad-credentials');
  }
  if (code === 'auth/too-many-requests') return new AuthError('too-many');
  if (code === 'auth/network-request-failed') return new AuthError('network');
  return new AuthError('unknown');
}

const firebaseAuth: AuthBackend = {
  async createAccount({ phone, password, fullName, role, artisan }) {
    const auth = getFirebaseAuth()!;
    const db = getDb()!;
    const cred = await createUserWithEmailAndPassword(auth, authIdFor(phone, role), password).catch((e) => {
      throw toAuthError(e);
    });
    const uid = cred.user.uid;
    const now = Date.now();
    const user: AppUser = {
      uid,
      role,
      fullName: fullName.trim(),
      phone: normalizePhone(phone),
      locale: config.defaultLocale,
      status: 'active',
      verified: false,
      rating: 0,
      ratingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'users', uid), user);
      if (role === 'artisan') {
        const categoryIds = artisan?.categoryIds ?? [];
        await setDoc(doc(db, 'artisanProfiles', uid), {
          uid,
          bio: artisan?.bio ?? '',
          experienceYears: artisan?.experienceYears ?? null,
          // One general service per category, with the category's id.
          serviceIds: categoryIds,
          categoryIds,
          availability: { days: [0, 1, 2, 3, 4, 6], from: '08:00', to: '20:00' },
          gallery: [],
          certificates: [],
          verificationStatus: 'unsubmitted',
          premium: false,
          completedJobs: 0,
          rating: 0,
          ratingCount: 0,
        });
      }
    } catch {
      // Don't leave a sign-in without a profile behind: the number could
      // never register again.
      await cred.user.delete().catch(() => {});
      throw new AuthError('unknown');
    }
    return user;
  },

  async signIn(phone, password, role) {
    const auth = getFirebaseAuth()!;
    const cred = await signInWithEmailAndPassword(auth, authIdFor(phone, role), password).catch((e) => {
      throw toAuthError(e);
    });
    const snap = await getDoc(doc(getDb()!, 'users', cred.user.uid)).catch(() => null);
    if (!snap?.exists()) {
      await firebaseSignOut(auth).catch(() => {});
      throw new AuthError('no-profile');
    }
    return mapUser(snap.id, snap.data());
  },

  async signInDemo(role) {
    return firebaseAuth.signIn(demoUser(role).phone, DEMO_PASSWORD, role).catch((e) => {
      throw e instanceof AuthError && e.code === 'bad-credentials' ? new AuthError('demo-missing') : e;
    });
  },

  async signOut() {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  },

  watch(cb) {
    const auth = getFirebaseAuth();
    return auth ? onAuthStateChanged(auth, (u) => cb(u?.uid ?? null)) : () => {};
  },
};

export const authService: AuthBackend = config.useMock ? mockAuth : firebaseAuth;

/** Translation key for an auth failure. */
export function authErrorKey(e: unknown) {
  const code: AuthErrorCode = e instanceof AuthError ? e.code : 'unknown';
  return `auth.err.${code}` as const;
}
