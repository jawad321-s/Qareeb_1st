import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { kv } from '@/lib/mmkv';
import { config } from '@/lib/config';
import { getAuthClient } from '@/lib/firebase';
import { unregisterPush } from '@/lib/push';
import { queryClient } from '@/lib/queryClient';
import {
  loadProfile,
  registerWithPhone,
  saveProfile,
  signInWithPhone,
  signOutFirebase,
  type RegisterParams,
} from '@/services/auth.service';
import type { AppUser, UserRole } from '@/types';
import { MOCK_ARTISANS, MOCK_CUSTOMER, MOCK_PAST_CUSTOMERS } from '@/mock/data';
import { normalizePhone } from '@/lib/phone';
import { localAccounts } from './accounts';

const SESSION_KEY = 'qareeb.session';

interface AuthState {
  user: AppUser | null;
  hydrated: boolean;
  signInAs: (role: UserRole) => void;
  signIn: (phone: string, password: string, role: UserRole) => Promise<void>;
  /**
   * Create an account for a phone number. Live: the Firebase account and its
   * profile documents. Demo: a device-local account (after the OTP step).
   */
  register: (params: RegisterParams) => Promise<void>;
  signOut: () => void;
  updateUser: (patch: Partial<AppUser>) => void;
  hydrate: () => void;
}

/**
 * Whether a number already has an account of this type — a demo account or one
 * created on this device. A number can hold one customer and one artisan account.
 */
export function hasAccount(phone: string, role: UserRole): boolean {
  const n = normalizePhone(phone);
  return (
    !!localAccounts.get(n, role) ||
    [MOCK_CUSTOMER, ...MOCK_PAST_CUSTOMERS, ...MOCK_ARTISANS].some((u) => u.role === role && normalizePhone(u.phone) === n)
  );
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,

  hydrate: () => {
    const saved = kv.get<AppUser>(SESSION_KEY);
    const auth = getAuthClient();
    if (!auth) {
      set({ user: saved ?? null, hydrated: true });
      return;
    }
    // Live: the Firebase session is the source of truth. Only the first event
    // matters here — sign-in/out after boot go through this store directly.
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      unsubscribe();
      if (!fbUser) {
        kv.remove(SESSION_KEY);
        set({ user: null, hydrated: true });
        return;
      }
      // Fall back to the cached snapshot when offline.
      const profile = await loadProfile(fbUser.uid).catch(() => (saved?.uid === fbUser.uid ? saved : null));
      if (profile) kv.set(SESSION_KEY, profile);
      set({ user: profile ?? null, hydrated: true });
    });
  },

  // Demo helper: instantly enter the app as a customer or artisan.
  signInAs: (role) => {
    const user = role === 'artisan' ? { ...MOCK_ARTISANS[0] } : { ...MOCK_CUSTOMER };
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  // Sign in with a phone number from the role's own sign-in page, which opens
  // that number's account of this type (its customer and artisan accounts are
  // separate).
  signIn: async (phone, password, role) => {
    if (!config.useMock) {
      const user = await signInWithPhone(phone, password, role);
      kv.set(SESSION_KEY, user);
      set({ user });
      return;
    }
    const base = role === 'artisan' ? MOCK_ARTISANS[0] : MOCK_CUSTOMER;
    const user = { ...base, fullName: localAccounts.get(phone, role)?.fullName ?? base.fullName, phone: normalizePhone(phone) };
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  register: async (params) => {
    if (!config.useMock) {
      const user = await registerWithPhone(params);
      kv.set(SESSION_KEY, user);
      set({ user });
      return;
    }
    const { phone, fullName, role } = params;
    localAccounts.add(phone, role, fullName);
    // The demo backs every new account with the role's demo data.
    const base = role === 'artisan' ? MOCK_ARTISANS[0] : MOCK_CUSTOMER;
    const user = { ...base, fullName, phone: normalizePhone(phone), createdAt: Date.now(), updatedAt: Date.now() };
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  signOut: () => {
    // Don't show the next account (same device) the previous one's data.
    queryClient.clear();
    if (!config.useMock) {
      // Remove this device's push token first, while still signed in.
      const uid = get().user?.uid;
      (uid ? unregisterPush(uid) : Promise.resolve()).finally(() => signOutFirebase().catch(() => {}));
    }
    kv.remove(SESSION_KEY);
    set({ user: null });
  },

  updateUser: (patch) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, ...patch, updatedAt: Date.now() };
    kv.set(SESSION_KEY, next);
    set({ user: next });
    if (!config.useMock) saveProfile(current.uid, patch).catch(() => {});
  },
}));
