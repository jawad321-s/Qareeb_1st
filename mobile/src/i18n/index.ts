import { create } from 'zustand';
import { storage } from '@/lib/mmkv';
import { config } from '@/lib/config';
import { getCurrentPathname } from '@/lib/currentRoute';
import type { Locale } from '@/types';
import { translations, type TranslationKey } from './translations';
import { reloadApp, syncNativeRTL } from './rtl';

const LOCALE_KEY = 'qareeb.locale';

/** One-shot route to return to after the RTL-flip restart (read by app/index). */
export const RESTORE_ROUTE_KEY = 'qareeb.restoreRoute';

/** One-shot marker that this boot is a language-switch reload — the root layout
 *  skips the animated splash so the user is back on their screen fast. */
export const LANG_RELOAD_KEY = 'qareeb.langReload';

const initialLocale: Locale = (storage.getString(LOCALE_KEY) as Locale) ?? config.defaultLocale;

/** Records the direction we last restarted for, so a boot can never loop. */
const RTL_FLIP_KEY = 'qareeb.rtlFlipAttempt';

// Boot-time direction sync — runs before the first render so rows, paddings
// and icons lay out natively RTL for Arabic. On native, a mismatch (e.g. first
// install) forces RTL and restarts once.
//
// The restart is attempted ONCE per direction. In Expo Go a JS-level reload
// does not always carry the native RTL flag across, so an unguarded restart
// would find the same mismatch on the next boot and restart again — trapping
// the app in a relaunch loop that ends with Expo Go closing. If the flip does
// not stick we simply keep running: `localizedTextAlign` still aligns text for
// the locale, and the flag applies on the next full launch of the app.
{
  const wantsRTL = initialLocale === 'ar';
  if (syncNativeRTL(wantsRTL)) {
    if (storage.getString(RTL_FLIP_KEY) !== String(wantsRTL)) {
      storage.set(RTL_FLIP_KEY, String(wantsRTL));
      void reloadApp();
    }
  } else {
    // Direction already matches — clear the marker so a later switch back
    // gets its own single restart.
    storage.delete(RTL_FLIP_KEY);
  }
}

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
}

function applyLocale(locale: Locale) {
  storage.set(LOCALE_KEY, locale);
  // Direction changes require a restart for the layout engine to flip.
  // Remember where the user is so the boot redirect brings them straight back
  // to this screen instead of dumping them on home.
  const path = getCurrentPathname();
  if (path && path !== '/') storage.set(RESTORE_ROUTE_KEY, path);
  storage.set(LANG_RELOAD_KEY, '1');
  // The user asked for this switch, so record the attempt for the new
  // direction before restarting — the boot guard above then won't restart
  // a second time for the same flip.
  storage.set(RTL_FLIP_KEY, String(locale === 'ar'));
  syncNativeRTL(locale === 'ar');
  void reloadApp();
}

/** Persisted app language. Defaults to Arabic. */
export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: initialLocale,
  setLocale: (locale) => {
    set({ locale });
    applyLocale(locale);
  },
  toggle: () => {
    const next: Locale = get().locale === 'ar' ? 'en' : 'ar';
    set({ locale: next });
    applyLocale(next);
  },
}));

/**
 * Translation hook. Returns the `t` function, the active locale, an `isRTL`
 * flag, and helpers to change the language.
 *
 *   const { t, isRTL } = useT();
 *   <Text>{t('home.categories')}</Text>
 */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const toggle = useLocaleStore((s) => s.toggle);

  const t = (key: TranslationKey): string =>
    translations[locale][key] ?? translations.en[key] ?? key;

  return { t, locale, setLocale, toggle, isRTL: locale === 'ar' };
}

/** Non-hook accessor for use outside React (e.g. utilities). */
export function translate(key: TranslationKey): string {
  const locale = useLocaleStore.getState().locale;
  return translations[locale][key] ?? translations.en[key] ?? key;
}

/**
 * Returns a mapper that swaps an Inter font family for its Cairo (Arabic)
 * equivalent when the app is in Arabic. Use for raw <TextInput> fontFamily.
 *   const font = useFont();
 *   style={{ fontFamily: font('Inter_400Regular') }}
 */
export function useFont() {
  const isRTL = useLocaleStore((s) => s.locale === 'ar');
  return (family: string) =>
    isRTL && family.startsWith('Inter') ? family.replace('Inter', 'Cairo') : family;
}
