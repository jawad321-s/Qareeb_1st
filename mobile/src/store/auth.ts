import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import type { AppUser, UserRole } from '@/types';
import { MOCK_ARTISANS, MOCK_CUSTOMER } from '@/mock/data';

const SESSION_KEY = 'qareeb.session';

interface AuthState {
  user: AppUser | null;
  hydrated: boolean;
  signInAs: (role: UserRole) => void;
  signIn: (phone: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => void;
  updateUser: (patch: Partial<AppUser>) => void;
  hydrate: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,

  hydrate: () => {
    const saved = kv.get<AppUser>(SESSION_KEY);
    set({ user: saved ?? null, hydrated: true });
  },

  // Demo helper: instantly enter the app as a customer or artisan.
  signInAs: (role) => {
    const user = role === 'artisan' ? { ...MOCK_ARTISANS[0] } : { ...MOCK_CUSTOMER };
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  // Sign in with a phone number. Each account type has its own sign-in entry,
  // so the chosen role — not the credentials — decides which app is opened.
  signIn: async (phone, _password, role) => {
    const base = role === 'artisan' ? MOCK_ARTISANS[0] : MOCK_CUSTOMER;
    const user = { ...base, phone };
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  signOut: () => {
    kv.remove(SESSION_KEY);
    set({ user: null });
  },

  updateUser: (patch) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, ...patch, updatedAt: Date.now() };
    kv.set(SESSION_KEY, next);
    set({ user: next });
  },
}));
