import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
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
  /** Create the account for a verified phone number (after the OTP step). */
  register: (input: { phone: string; fullName: string; role: UserRole }) => void;
  signOut: () => void;
  updateUser: (patch: Partial<AppUser>) => void;
  hydrate: () => void;
}

/** Which role a phone number is registered under: a demo account or one created on this device. */
export function accountRole(phone: string): UserRole | undefined {
  const n = normalizePhone(phone);
  const demo = [MOCK_CUSTOMER, ...MOCK_PAST_CUSTOMERS, ...MOCK_ARTISANS].find((u) => normalizePhone(u.phone) === n);
  return localAccounts.get(n)?.role ?? demo?.role;
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

  // Sign in with a phone number from the role's own sign-in page. A number
  // belongs to one account, so a number already registered with the other
  // role is refused (error 'registered-as-customer' / 'registered-as-artisan').
  signIn: async (phone, _password, role) => {
    const owner = accountRole(phone);
    if (owner && owner !== role) throw new Error(`registered-as-${owner}`);
    const base = role === 'artisan' ? MOCK_ARTISANS[0] : MOCK_CUSTOMER;
    const user = { ...base, fullName: localAccounts.get(phone)?.fullName ?? base.fullName, phone: normalizePhone(phone) };
    kv.set(SESSION_KEY, user);
    set({ user });
  },

  register: ({ phone, fullName, role }) => {
    localAccounts.add(phone, { role, fullName });
    // The demo backs every new account with the role's demo data.
    const base = role === 'artisan' ? MOCK_ARTISANS[0] : MOCK_CUSTOMER;
    const user = { ...base, fullName, phone: normalizePhone(phone), createdAt: Date.now(), updatedAt: Date.now() };
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
