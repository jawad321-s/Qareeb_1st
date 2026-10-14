import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import { config } from '@/lib/config';
import { authService, type AccountRole, type NewAccount } from '@/services/auth.service';
import type { AppUser } from '@/types';

const SESSION_KEY = 'qareeb.session';

interface AuthState {
  user: AppUser | null;
  hydrated: boolean;
  /** Account just created on the register screen, waiting for the OTP step. */
  pending: AppUser | null;
  /** Demo entry: the role's demo account. */
  signInAs: (role: AccountRole) => Promise<void>;
  signIn: (phone: string, password: string, role: AccountRole) => Promise<void>;
  /** Create the account (throws AuthError('phone-taken')); it opens after the OTP step. */
  createAccount: (input: NewAccount) => Promise<void>;
  /** Called by the OTP step: opens the account just created. False if there is none. */
  finishRegistration: () => boolean;
  signOut: () => void;
  updateUser: (patch: Partial<AppUser>) => void;
  hydrate: () => void;
}

let unwatch: (() => void) | null = null;

export const useAuth = create<AuthState>((set, get) => {
  const open = (user: AppUser) => {
    kv.set(SESSION_KEY, user);
    set({ user, pending: null });
  };
  const clear = () => {
    kv.remove(SESSION_KEY);
    set({ user: null });
  };

  return {
    user: null,
    hydrated: false,
    pending: null,

    hydrate: () => {
      const saved = kv.get<AppUser>(SESSION_KEY);
      set({ user: saved ?? null, hydrated: true });
      // Firebase: the app's session is only good while Firebase is signed into
      // the same account — otherwise every read would be refused. Drop it so
      // the user signs in again.
      if (!config.useMock && !unwatch) {
        unwatch = authService.watch((uid) => {
          const current = get().user;
          if (current && current.uid !== uid) clear();
        });
      }
    },

    signInAs: async (role) => open(await authService.signInDemo(role)),

    // Each role's sign-in page opens that number's account of its own type.
    signIn: async (phone, password, role) => open(await authService.signIn(phone, password, role)),

    createAccount: async (input) => {
      const user = await authService.createAccount(input);
      set({ pending: user });
    },

    finishRegistration: () => {
      const { pending } = get();
      if (!pending) return false;
      open(pending);
      return true;
    },

    signOut: () => {
      authService.signOut().catch(() => {});
      clear();
    },

    updateUser: (patch) => {
      const current = get().user;
      if (!current) return;
      const next = { ...current, ...patch, updatedAt: Date.now() };
      kv.set(SESSION_KEY, next);
      set({ user: next });
    },
  };
});
