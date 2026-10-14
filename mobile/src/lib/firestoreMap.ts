// Firestore document → app type mapping shared by the data and auth services.
import type { AppUser, GeoLocation } from '@/types';

// Firestore stores timestamps as Timestamp; the app uses epoch millis.
export const ms = (v: any): number =>
  v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : Date.now();

/** Locations written by the seed hold a GeoPoint; the app uses plain numbers. */
export function mapLocation(loc: any): GeoLocation | undefined {
  if (!loc) return undefined;
  return {
    latitude: loc.latitude ?? loc.geopoint?.latitude,
    longitude: loc.longitude ?? loc.geopoint?.longitude,
    geohash: loc.geohash ?? '',
    address: loc.address ?? '',
  };
}

export function mapUser(id: string, v: any): AppUser {
  return { ...v, uid: id, location: mapLocation(v.location), createdAt: ms(v.createdAt), updatedAt: ms(v.updatedAt) } as AppUser;
}
