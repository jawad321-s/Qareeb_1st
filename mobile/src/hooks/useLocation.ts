import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import type { GeoLocation } from '@/types';

type PermissionState = 'undetermined' | 'granted' | 'denied';

/**
 * Requests foreground location permission and resolves the device's current
 * position into our GeoLocation shape (with a reverse-geocoded address).
 */
export function useLocation() {
  const [status, setStatus] = useState<PermissionState>('undetermined');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);

  const request = useCallback(async (): Promise<GeoLocation | null> => {
    setLoading(true);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return null;
      }
      setStatus('granted');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }).catch(() => [null]);

      const geo: GeoLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        geohash: '',
        address: place ? [place.district ?? place.name, place.city].filter(Boolean).join(', ') : 'Current location',
      };
      setLocation(geo);
      return geo;
    } catch {
      setStatus('denied');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { status, loading, location, request };
}
