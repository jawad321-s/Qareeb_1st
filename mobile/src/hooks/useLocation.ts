import { useCallback, useState } from 'react';
import type { GeoLocation } from '@/types';
import { locate, LocateError, type LocateProblem } from '@/lib/currentLocation';

export type LocateResult = { location: GeoLocation } | { problem: LocateProblem };

/**
 * The "Enable location" button: asks for the permission (and on Android to
 * switch location on), then resolves the device's position and address — or
 * says why it couldn't (see lib/currentLocation).
 */
export function useLocation() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);

  const request = useCallback(async (): Promise<LocateResult> => {
    setLoading(true);
    try {
      const geo = await locate();
      setLocation(geo);
      return { location: geo };
    } catch (e) {
      return { problem: e instanceof LocateError ? e.problem : 'unavailable' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, location, request };
}
