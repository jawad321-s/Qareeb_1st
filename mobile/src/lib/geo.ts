import type { GeoLocation } from '@/types';

/** Straight-line distance between two points in km (haversine). */
export function distanceKm(a: Pick<GeoLocation, 'latitude' | 'longitude'>, b: Pick<GeoLocation, 'latitude' | 'longitude'>): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
