import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import type { AppUser, VerificationStatus } from '@/types';
import { submitVerification, watchVerificationStatus } from '@/services/verification.service';

const STORE_KEY = 'qareeb.verification';

export type DocSlot = 'idFront' | 'idBack' | 'selfie';

interface Certificate {
  id: string;
  uri: string;
}

/** Professional info captured at artisan sign-up, carried into verification. */
export interface ArtisanDraft {
  categoryIds: string[];
  experienceYears?: number;
  serviceRadiusKm?: number;
  bio?: string;
}

interface VerificationSnapshot {
  status: VerificationStatus;
  idFront?: string;
  idBack?: string;
  selfie?: string;
  certificates: Certificate[];
  submittedAt?: number;
  draft: ArtisanDraft;
}

interface VerificationState extends VerificationSnapshot {
  hydrated: boolean;
  hydrate: () => void;
  setDoc: (slot: DocSlot, uri: string) => void;
  addCertificate: (uri: string) => void;
  removeCertificate: (id: string) => void;
  setArtisanDraft: (draft: ArtisanDraft) => void;
  submit: (user: AppUser) => Promise<void>;
  watch: (uid: string) => () => void;
  setStatus: (status: VerificationStatus) => void;
  reset: () => void;
}

const EMPTY: VerificationSnapshot = { status: 'unsubmitted', certificates: [], draft: { categoryIds: [] } };

export const useVerification = create<VerificationState>((set, get) => {
  const save = () => {
    const { status, idFront, idBack, selfie, certificates, submittedAt, draft } = get();
    kv.set<VerificationSnapshot>(STORE_KEY, { status, idFront, idBack, selfie, certificates, submittedAt, draft });
  };

  return {
    ...EMPTY,
    hydrated: false,

    hydrate: () => {
      const saved = kv.get<VerificationSnapshot>(STORE_KEY);
      set({ ...EMPTY, ...(saved ?? {}), draft: saved?.draft ?? EMPTY.draft, hydrated: true });
    },

    setDoc: (slot, uri) => {
      set({ [slot]: uri } as Partial<VerificationState>);
      save();
    },

    addCertificate: (uri) => {
      set((s) => ({ certificates: [...s.certificates, { id: `c_${Date.now()}`, uri }] }));
      save();
    },

    removeCertificate: (id) => {
      set((s) => ({ certificates: s.certificates.filter((c) => c.id !== id) }));
      save();
    },

    // Called from the artisan sign-up form so the professional profile survives
    // into verification (and Firestore) instead of being discarded.
    setArtisanDraft: (draft) => {
      set({ draft });
      save();
    },

    submit: async (user) => {
      set({ status: 'pending', submittedAt: Date.now() });
      save();
      const { idFront, idBack, selfie, certificates, draft } = get();
      // Push to Firestore (no-op on mock) so the admin queue picks it up live.
      if (idFront && idBack) {
        await submitVerification({
          user,
          categoryIds: draft.categoryIds,
          experienceYears: draft.experienceYears,
          serviceRadiusKm: draft.serviceRadiusKm,
          bio: draft.bio,
          idFront,
          idBack,
          selfie,
          certificates: certificates.map((c) => c.uri),
        }).catch(() => {});
      }
    },

    // Live-subscribe to admin decisions; keeps local status in sync.
    watch: (uid) =>
      watchVerificationStatus(uid, (status) => {
        set({ status });
        save();
      }),

    setStatus: (status) => {
      set({ status });
      save();
    },

    reset: () => {
      set({ ...EMPTY });
      save();
    },
  };
});
