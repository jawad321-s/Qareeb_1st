import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { GeoLocation } from '@/types';
import { useLocaleStore } from '@/i18n';
import { translations } from '@/i18n/translations';

/**
 * Where the device is, with a short address — on iPhone, Android and in a
 * browser (PC).
 *
 * What went wrong before, and is handled here:
 *  - Android with location (GPS) switched off failed as "permission denied";
 *    now the system dialog to switch it on is shown, and a fix that doesn't
 *    come (indoors) falls back to the last known position instead of waiting.
 *  - In a browser the position could wait for ever (no time limit), a PC with
 *    no location service failed as "permission denied", and there was never
 *    an address (expo-location has no geocoder on the web).
 *  - The address used the house number on Android ("12, Hebron"), or an
 *    English "Current location".
 * Addresses come from the phone's own geocoder, else from OpenStreetMap.
 */

/** Why no position: each has its own message (loc.* texts). */
export type LocateProblem = 'denied' | 'blocked' | 'servicesOff' | 'insecure' | 'unavailable';

export class LocateError extends Error {
  constructor(public problem: LocateProblem) {
    super(problem);
  }
}

type Coords = { latitude: number; longitude: number };

const FIX_TIMEOUT_MS = 12_000;
const ADDRESS_TIMEOUT_MS = 6_000;
const isWeb = Platform.OS === 'web';

const within = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

/** The browser's own geolocation, with a time limit and the reason when it fails. */
function browserFix(timeoutMs: number): Promise<Coords> {
  return new Promise((resolve, reject) => {
    // Browsers only locate on https:// or localhost.
    if (typeof window !== 'undefined' && window.isSecureContext === false) return reject(new LocateError('insecure'));
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo) return reject(new LocateError('unavailable'));
    geo.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      // 1 = refused (in the browser, it stays refused until allowed by the address bar).
      (e) => reject(new LocateError(e.code === 1 ? 'blocked' : 'unavailable')),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60_000 },
    );
  });
}

/** Whether the browser already allows location (never asks). */
async function browserAllowed(): Promise<boolean> {
  try {
    const state = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return state.state === 'granted';
  } catch {
    return false;
  }
}

async function phoneFix(ask: boolean, timeoutMs: number): Promise<Coords> {
  const perm = ask ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new LocateError(perm.canAskAgain === false ? 'blocked' : 'denied');

  if (!(await Location.hasServicesEnabledAsync().catch(() => true))) {
    // Android can switch location on from a system dialog; iPhone only in Settings.
    if (!ask || Platform.OS !== 'android') throw new LocateError('servicesOff');
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      throw new LocateError('servicesOff');
    }
  }

  const fresh = await within(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null), timeoutMs);
  const pos =
    fresh ??
    (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 }).catch(() => null)) ??
    (await within(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null), 6_000));
  if (!pos) throw new LocateError('unavailable');
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

/** "Area, Town" from the first usable name of each (a bare house number is skipped). */
function shortAddress(area: (string | null | undefined)[], town: (string | null | undefined)[]): string {
  const pick = (xs: (string | null | undefined)[]) => xs.map((x) => x?.trim()).find((x) => x && !/^\d+[\w-]*$/.test(x));
  const a = pick(area);
  const b = pick(town);
  const comma = useLocaleStore.getState().locale === 'ar' ? '، ' : ', ';
  return [a, b].filter((x, i, all) => x && all.indexOf(x) === i).join(comma);
}

/** OpenStreetMap's free reverse geocoder, in the app's language. */
async function openStreetMapAddress({ latitude, longitude }: Coords): Promise<string> {
  const lang = useLocaleStore.getState().locale;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${latitude}&lon=${longitude}&accept-language=${lang}`,
    isWeb ? undefined : { headers: { 'User-Agent': 'Qareeb-app/1.0' } },
  ).catch(() => null);
  if (!res?.ok) return '';
  const a = ((await res.json().catch(() => null)) as { address?: Record<string, string> } | null)?.address ?? {};
  return shortAddress([a.suburb, a.neighbourhood, a.quarter, a.road, a.village], [a.city, a.town, a.village, a.county, a.state]);
}

async function addressOf(here: Coords): Promise<string> {
  if (!isWeb) {
    const places = await within(Location.reverseGeocodeAsync(here).catch(() => []), ADDRESS_TIMEOUT_MS);
    const place = places?.[0];
    const text = place ? shortAddress([place.district, place.street, place.name], [place.city, place.subregion, place.region]) : '';
    if (text) return text;
  }
  const text = await within(openStreetMapAddress(here).catch(() => ''), ADDRESS_TIMEOUT_MS);
  return text || translations[useLocaleStore.getState().locale]['loc.here'];
}

async function withAddress(here: Coords): Promise<GeoLocation> {
  return { ...here, geohash: '', address: await addressOf(here) };
}

/**
 * The "Enable location" button: asks for the permission (and, on Android, to
 * switch location on), then finds the position and its address. Throws a
 * LocateError saying why when it can't.
 */
export async function locate(): Promise<GeoLocation> {
  const here = isWeb ? await browserFix(FIX_TIMEOUT_MS) : await phoneFix(true, FIX_TIMEOUT_MS);
  return withAddress(here);
}

/**
 * Where the device is now, or null when location isn't allowed (or is off) or
 * no position comes within `timeoutMs`. Never asks anything.
 */
export async function currentLocation(timeoutMs = 8000): Promise<GeoLocation | null> {
  try {
    if (isWeb && !(await browserAllowed())) return null;
    const here = isWeb ? await browserFix(timeoutMs) : await phoneFix(false, timeoutMs);
    return await withAddress(here);
  } catch {
    return null;
  }
}
