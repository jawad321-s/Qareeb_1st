import { useMemo } from 'react';
import { useAuth } from '@/store/auth';
import { useMyRequests } from './queries';
import { pastArtisans } from '@/lib/pastArtisans';

/**
 * The artisans the signed-in customer has worked with, worked out from their
 * own requests (nothing extra is stored). Empty for an artisan.
 */
export function usePastArtisans() {
  const user = useAuth((s) => s.user);
  const requests = useMyRequests(user?.role === 'customer' ? user.uid : '');
  const list = useMemo(() => pastArtisans(requests.data ?? []), [requests.data]);
  const byId = useMemo(() => new Map(list.map((p) => [p.artisanId, p])), [list]);
  return { list, byId, isLoading: requests.isLoading };
}
