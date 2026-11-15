import * as Location from 'expo-location';
import type { GeoLocation } from '@/types';

/**
 * Where the phone is now, with a short address, or null when location access
 * isn't granted or no fix arrives within `timeoutMs`. Never prompts.
 */
export async function currentLocation(fallbackAddress = '', timeoutMs = 8000): Promise<GeoLocation | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const pos = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
  if (!pos) return null;
  const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  const [place] = await Location.reverseGeocodeAsync(here).catch(() => [null]);
  return {
    ...here,
    geohash: '',
    address: place ? [place.district ?? place.name, place.city].filter(Boolean).join(', ') : fallbackAddress,
  };
}
