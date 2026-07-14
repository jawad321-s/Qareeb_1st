import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import type { AppUser, UserRole } from '@/types';
import { MOCK_ARTISANS, MOCK_CUSTOMER } from '@/mock/data';

const SESSION_KEY = 'qareeb.session';

interface AuthState {
  user: AppUser | null;
  hydrated: boolean;
  signInAs: (role: UserRole) => void;
  signIn: (email: string, password: string) => Promise<void>;
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

  signIn: async (email) => {
    // Mock auth: any credentials succeed; artisan emails route to the artisan app.
    const isArtisan = email.toLowerCase().includes('artisan') || email.toLowerCase().includes('omar');
    const user = isArtisan ? { ...MOCK_ARTISANS[0], email } : { ...MOCK_CUSTOMER, email };
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
