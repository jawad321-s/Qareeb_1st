import { DevSettings, I18nManager, Platform } from 'react-native';

/**
 * Native RTL synchronisation. Translating strings isn't enough — the layout
 * engine itself must flip (rows, paddings, icon sides). React Native does that
 * through I18nManager, but changes only apply after a reload.
 */

/** Set the layout engine's direction (browser: the language's; phones: always right-to-left). Returns true if a reload is needed. */
export function syncNativeRTL(isArabic: boolean): boolean {
  if (Platform.OS === 'web') {
    // On web, flexbox follows the document direction — flip it directly.
    try {
      I18nManager.allowRTL(isArabic);
      I18nManager.forceRTL(isArabic);
    } catch {
      // RNW variations — dir attribute below is what actually drives layout
    }
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
      document.documentElement.lang = isArabic ? 'ar' : 'en';
    }
    return false;
  }
  // Phones: the engine always runs right-to-left, whatever the language, as
  // app.json forces it at launch. Turning it off for English would leave the
  // next launch left-to-right (Arabic would then need a restart to look
  // right); English is flipped from the root view instead (directionStyle).
  void isArabic;
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    return true;
  }
  return false;
}

/**
 * The phone's layout engine runs right-to-left whatever the language: app.json
 * forces it (Expo Go resets the direction on every launch otherwise), which is
 * what Arabic needs. English is turned back to left-to-right from the top of
 * the app instead: `direction: 'ltr'` on the root view flips rows, paddings,
 * start/end positions and text alignment for everything inside it, and the
 * navigation stack is told as well (screens slide in from the right, swipe
 * back from the left edge). Arabic is left exactly as the engine lays it out.
 */
export function screenDirection(isArabic: boolean): 'rtl' | 'ltr' {
  if (isArabic) return I18nManager.getConstants().isRTL ? 'rtl' : 'ltr';
  return 'ltr';
}

/** For a root view (the app, a modal): left-to-right in English, nothing in Arabic. */
export function directionStyle(isArabic: boolean): { direction: 'ltr' } | undefined {
  return isArabic ? undefined : { direction: 'ltr' };
}

/** Whether screens really run right-to-left, i.e. arrows and chevrons are mirrored. */
export function isLayoutRTL(isArabic: boolean): boolean {
  return isArabic && I18nManager.isRTL;
}

/**
 * Physical text alignment for the active language.
 *
 * When the NATIVE layout direction already matches the locale, return
 * `undefined` and let the engine align naturally: React Native's RTL mode
 * swaps the meaning of 'left'/'right' styles, so forcing `textAlign: 'right'`
 * inside an RTL layout actually renders on the physical LEFT — which pushed
 * Arabic labels away from their icons. Forcing is only needed when there is a
 * mismatch (e.g. Arabic selected but the RTL flip hasn't applied yet) or on
 * web, where alignment values are literal. (English, with the engine still
 * right-to-left, gets 'left': under the root's left-to-right direction that
 * is the physical left.)
 */
export function localizedTextAlign(isRTL: boolean): 'left' | 'right' | undefined {
  if (Platform.OS !== 'web' && I18nManager.isRTL === isRTL) return undefined;
  return isRTL ? 'right' : 'left';
}

/**
 * Restart the app so the new layout direction takes effect.
 *
 * This used to call `Updates.reloadAsync()`, but `expo-updates` is not
 * supported in Expo Go: with it installed, Expo Go boots the app through the
 * updates JS runtime, where no native modules are registered — the app then
 * dies with "Cannot find native module 'ExpoAsset'" and "main has not been
 * registered". `DevSettings.reload()` restarts the bundle just as well in Expo
 * Go and in development builds, which is where this app runs.
 */
export async function reloadApp() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.reload();
    return;
  }
  DevSettings?.reload?.();
}
