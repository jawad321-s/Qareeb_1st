import { useEffect } from 'react';
import * as Location from 'expo-location';
import { config } from '@/lib/config';
import { distanceKm } from '@/lib/geo';
import { useAuth } from '@/store/auth';

// Requests are dispatched by distance from the artisan's saved location, so
// keep it current: on app open, if permission was already granted, save the
// device position when it moved more than this far. Never prompts.
const MIN_MOVE_KM = 0.3;

export function useRefreshArtisanLocation(enabled: boolean) {
  useEffect(() => {
    if (!enabled || config.useMock) return;
    let cancelled = false;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (cancelled) return;
      const { user, updateUser } = useAuth.getState();
      if (!user) return;
      const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      if (user.location && distanceKm(user.location, here) < MIN_MOVE_KM) return;
      const [place] = await Location.reverseGeocodeAsync(here).catch(() => [null]);
      updateUser({
        location: {
          ...here,
          geohash: '',
          address: place ? [place.district ?? place.name, place.city].filter(Boolean).join(', ') : user.location?.address ?? '',
        },
      });
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
