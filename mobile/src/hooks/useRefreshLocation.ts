import { useEffect } from 'react';
import { config } from '@/lib/config';
import { currentLocation } from '@/lib/currentLocation';
import { distanceKm } from '@/lib/geo';
import { useAuth } from '@/store/auth';

// Requests are matched by distance between the request (the customer's
// location) and the artisan's saved location, so keep both current: on app
// open, if permission was already granted, save the device position when it
// moved more than this far. Never prompts.
export const MIN_MOVE_KM = 0.3;

/** Keeps the signed-in user's saved location up to date (customers and artisans). */
export function useRefreshLocation(enabled: boolean) {
  useEffect(() => {
    if (!enabled || config.useMock) return;
    let cancelled = false;
    (async () => {
      const { user } = useAuth.getState();
      const here = await currentLocation(user?.location?.address ?? '');
      const { user: now, updateUser } = useAuth.getState();
      if (cancelled || !here || !now) return;
      if (now.location && distanceKm(now.location, here) < MIN_MOVE_KM) return;
      updateUser({ location: here });
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
