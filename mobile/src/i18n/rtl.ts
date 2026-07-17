import { I18nManager, Platform } from 'react-native';

/**
 * Native RTL synchronisation. Translating strings isn't enough — the layout
 * engine itself must flip (rows, paddings, icon sides). React Native does that
 * through I18nManager, but changes only apply after a reload.
 */

/** Align the layout engine with the language. Returns true if a reload is needed. */
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
  if (I18nManager.isRTL !== isArabic) {
    I18nManager.allowRTL(isArabic);
    I18nManager.forceRTL(isArabic);
    return true;
  }
  return false;
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
 * web, where alignment values are literal.
 */
export function localizedTextAlign(isRTL: boolean): 'left' | 'right' | undefined {
  if (Platform.OS !== 'web' && I18nManager.isRTL === isRTL) return undefined;
  return isRTL ? 'right' : 'left';
}

/** Restart the app so the new layout direction takes effect. */
export async function reloadApp() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.reload();
    return;
  }
  try {
    const Updates = await import('expo-updates');
    await Updates.reloadAsync();
  } catch {
    // Dev / Expo Go fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DevSettings } = require('react-native');
    DevSettings?.reload?.();
  }
}
