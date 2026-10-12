import { kv } from '@/lib/mmkv';
import { normalizePhone } from '@/lib/phone';
import type { UserRole } from '@/types';

// Accounts created on this device, keyed by normalized phone number — the
// account identity. The demo has no server-side account store, so this is what
// stops the same number from being registered twice.
const KEY = 'qareeb.accounts';

export interface LocalAccount {
  role: UserRole;
  fullName: string;
  createdAt: number;
}

const all = () => kv.get<Record<string, LocalAccount>>(KEY) ?? {};

export const localAccounts = {
  get: (phone: string): LocalAccount | undefined => all()[normalizePhone(phone)],
  add: (phone: string, account: Omit<LocalAccount, 'createdAt'>) => {
    kv.set(KEY, { ...all(), [normalizePhone(phone)]: { ...account, createdAt: Date.now() } });
  },
};
