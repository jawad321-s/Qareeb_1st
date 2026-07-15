import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import type { VerificationStatus } from '@/types';

const STORE_KEY = 'qareeb.verification';

export type DocSlot = 'idFront' | 'idBack' | 'selfie';

interface Certificate {
  id: string;
  uri: string;
}

interface VerificationSnapshot {
  status: VerificationStatus;
  idFront?: string;
  idBack?: string;
  selfie?: string;
  certificates: Certificate[];
  submittedAt?: number;
}

interface VerificationState extends VerificationSnapshot {
  hydrated: boolean;
  hydrate: () => void;
  setDoc: (slot: DocSlot, uri: string) => void;
  addCertificate: (uri: string) => void;
  removeCertificate: (id: string) => void;
  submit: () => void;
  reset: () => void;
}

const EMPTY: VerificationSnapshot = { status: 'unsubmitted', certificates: [] };

const persist = (s: VerificationSnapshot) => kv.set(STORE_KEY, s);

export const useVerification = create<VerificationState>((set, get) => ({
  ...EMPTY,
  hydrated: false,

  hydrate: () => {
    const saved = kv.get<VerificationSnapshot>(STORE_KEY);
    set({ ...(saved ?? EMPTY), hydrated: true });
  },

  setDoc: (slot, uri) => {
    set({ [slot]: uri } as Partial<VerificationState>);
    const { status, idFront, idBack, selfie, certificates } = get();
    persist({ status, idFront, idBack, selfie, certificates });
  },

  addCertificate: (uri) => {
    const cert = { id: `c_${Date.now()}`, uri };
    set((s) => ({ certificates: [...s.certificates, cert] }));
    const { status, idFront, idBack, selfie, certificates } = get();
    persist({ status, idFront, idBack, selfie, certificates });
  },

  removeCertificate: (id) => {
    set((s) => ({ certificates: s.certificates.filter((c) => c.id !== id) }));
    const { status, idFront, idBack, selfie, certificates } = get();
    persist({ status, idFront, idBack, selfie, certificates });
  },

  submit: () => {
    const submittedAt = Date.now();
    set({ status: 'pending', submittedAt });
    const { idFront, idBack, selfie, certificates } = get();
    persist({ status: 'pending', idFront, idBack, selfie, certificates, submittedAt });
  },

  reset: () => {
    set({ ...EMPTY });
    persist(EMPTY);
  },
}));
