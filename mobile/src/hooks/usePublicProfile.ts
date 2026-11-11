import { useEffect } from 'react';
import { config } from '@/lib/config';
import { publishPublicProfile } from '@/services/auth.service';
import type { AppUser } from '@/types';

/**
 * Keeps publicProfiles/{uid}, what other users see of this account (name,
 * photo, rating, join date), in step with the signed-in user. Accounts made
 * before public profiles existed get theirs the next time they open the app.
 */
export function usePublicProfile(user: AppUser | null) {
  useEffect(() => {
    if (config.useMock || !user) return;
    publishPublicProfile(user).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.fullName, user?.photoUrl, user?.rating, user?.ratingCount]);
}
