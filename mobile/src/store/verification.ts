import { create } from 'zustand';
import { kv } from '@/lib/mmkv';
import type { AppUser, VerificationStatus } from '@/types';
import { submitVerification, watchVerificationStatus } from '@/services/verification.service';

const STORE_KEY = 'qareeb.verification';

/** The two required photos: the ID card and the artisan themselves. */
export type DocSlot = 'idPhoto' | 'selfie';

interface Certificate {
  id: string;
  uri: string;
}

/** Professional info captured at artisan sign-up, carried into verification. */
export interface ArtisanDraft {
  categoryIds: string[];
  experienceYears?: number;
  bio?: string;
}

interface VerificationSnapshot {
  status: VerificationStatus;
  idPhoto?: string;
  selfie?: string;
  certificates: Certificate[];
  submittedAt?: number;
  draft: ArtisanDraft;
  /** The account these photos and status belong to. */
  owner?: string;
}

interface VerificationState extends VerificationSnapshot {
  hydrated: boolean;
  hydrate: () => void;
  bind: (uid: string) => void;
  setDoc: (slot: DocSlot, uri: string) => void;
  addCertificate: (uri: string) => void;
  removeCertificate: (id: string) => void;
  setArtisanDraft: (draft: ArtisanDraft) => void;
  submit: (user: AppUser) => Promise<void>;
  watch: (uid: string) => () => void;
  setStatus: (status: VerificationStatus) => void;
  reset: () => void;
}

// Every field is listed, photos included: zustand's set() merges, so a field
// left out would keep the previous account's value.
const EMPTY: VerificationSnapshot = {
  status: 'unsubmitted',
  idPhoto: undefined,
  selfie: undefined,
  certificates: [],
  submittedAt: undefined,
  draft: { categoryIds: [] },
  owner: undefined,
};

export const useVerification = create<VerificationState>((set, get) => {
  const save = () => {
    const { status, idPhoto, selfie, certificates, submittedAt, draft, owner } = get();
    kv.set<VerificationSnapshot>(STORE_KEY, { status, idPhoto, selfie, certificates, submittedAt, draft, owner });
  };

  return {
    ...EMPTY,
    hydrated: false,

    hydrate: () => {
      const saved = kv.get<VerificationSnapshot>(STORE_KEY);
      // Only known fields: older snapshots carried idFront/idBack.
      set({
        ...EMPTY,
        status: saved?.status ?? EMPTY.status,
        idPhoto: saved?.idPhoto,
        selfie: saved?.selfie,
        certificates: saved?.certificates ?? [],
        submittedAt: saved?.submittedAt,
        draft: saved?.draft ?? EMPTY.draft,
        owner: saved?.owner,
        hydrated: true,
      });
    },

    // Another account on this device starts clean: its own photos and status
    // (the sign-up draft is kept, it belongs to the account just created).
    bind: (uid) => {
      if (get().owner === uid) return;
      set({ ...EMPTY, draft: get().draft, owner: uid });
      save();
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

    // Sends the photos to the admin queue (no-op on mock). Throws on failure,
    // leaving the status as it was so the artisan can try again.
    submit: async (user) => {
      const { idPhoto, selfie, certificates, draft } = get();
      if (!idPhoto || !selfie) return;
      await submitVerification({
        user,
        categoryIds: draft.categoryIds,
        experienceYears: draft.experienceYears,
        bio: draft.bio,
        idPhoto,
        selfie,
        certificates: certificates.map((c) => c.uri),
      });
      set({ status: 'pending', submittedAt: Date.now() });
      save();
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

    // On sign-out: nothing of this account stays for the next one.
    reset: () => {
      set({ ...EMPTY });
      save();
    },
  };
});
