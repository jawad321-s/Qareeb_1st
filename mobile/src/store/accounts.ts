import { kv } from '@/lib/mmkv';
import { normalizePhone } from '@/lib/phone';
import type { UserRole } from '@/types';

// Accounts created on this device. A phone number can hold one customer
// account and one separate artisan account, so they are kept per role, keyed
// by normalized number. The demo has no server-side account store, so this is
// what stops the same number from registering the same account type twice.
const KEY = 'qareeb.accounts.v2';
// v1 held a single account per number: { [phone]: { role, fullName, createdAt } }.
const V1_KEY = 'qareeb.accounts';

export interface LocalAccount {
  fullName: string;
  createdAt: number;
}

type Registry = Partial<Record<UserRole, Record<string, LocalAccount>>>;

function all(): Registry {
  const saved = kv.get<Registry>(KEY);
  if (saved) return saved;
  const v1 = kv.get<Record<string, LocalAccount & { role: UserRole }>>(V1_KEY) ?? {};
  const migrated: Registry = {};
  for (const [phone, { role, ...account }] of Object.entries(v1)) {
    migrated[role] = { ...migrated[role], [phone]: account };
  }
  return migrated;
}

export const localAccounts = {
  get: (phone: string, role: UserRole): LocalAccount | undefined => all()[role]?.[normalizePhone(phone)],
  add: (phone: string, role: UserRole, fullName: string) => {
    const registry = all();
    kv.set(KEY, { ...registry, [role]: { ...registry[role], [normalizePhone(phone)]: { fullName, createdAt: Date.now() } } });
  },
};
