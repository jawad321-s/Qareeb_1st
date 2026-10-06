import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { openVerificationRequest } from '@/services/verification.service';
import type { AppUser } from '@/types';

/**
 * Artisans who signed up before verification requests were opened at
 * registration get one on their next app open, so the admin can approve them.
 */
export function useEnsureVerificationRequest(user: AppUser | null) {
  const uid = user?.role === 'artisan' && !user.verified ? user.uid : undefined;
  useEffect(() => {
    const db = getDb();
    if (config.useMock || !uid || !db || !user) return;
    getDoc(doc(db, 'artisanProfiles', uid))
      .then((p) => openVerificationRequest(user, (p.data()?.categoryIds as string[]) ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
}
