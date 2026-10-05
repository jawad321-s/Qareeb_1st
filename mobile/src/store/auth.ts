import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { kv } from '@/lib/mmkv';
import { config } from '@/lib/config';
import { getAuthClient } from '@/lib/firebase';
import {
  loadProfile,
  registerWithPhone,
  saveProfile,
  signInWithPhone,
  signOutFirebase,
  type RegisterParams,
} from '@/services/auth.service';
import type { AppUser, UserRole } from '@/types';
import { MOCK_ARTISANS, MOCK_CUSTOMER } from '@/mock/data';

const SESSION_KEY = 'qareeb.session';

interface AuthState {
  user: AppUser | null;
  hydrated: boolean;
  signInAs: (role: UserRole) => void;
  signIn: (phone: string, password: string, role: UserRole) => Promise<void>;
  /** Live backend only: creates the Firebase account and profile documents. */
  register: (params: RegisterParams) => Promise<void>;
  signOut: () => void;
  updateUser: (patch: Partial<AppUser>) => void;
  hydrate: () => void;
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

  // Sign in with a phone number. Each account type has its own sign-in entry,
  // so the chosen role — not the credentials — decides which app is opened.
  signIn: async (phone, password, role) => {
    if (!config.useMock) {
      const user = await signInWithPhone(phone, password, role);
      kv.set(SESSION_KEY, user);
      set({ user });
      return;
    }
    const base = role === 'artisan' ? MOCK_ARTISANS[0] : MOCK_CUSTOMER;
    const user = { ...base, phone };
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  register: async (params) => {
    const user = await registerWithPhone(params);
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  signOut: () => {
    if (!config.useMock) signOutFirebase().catch(() => {});
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
