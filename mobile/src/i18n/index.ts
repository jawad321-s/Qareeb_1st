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

// Boot-time direction sync. This only ASKS the layout engine to flip — it never
// restarts the app.
//
// Restarting here was a trap: on a fresh install the saved locale is Arabic
// while the native direction is still LTR, so boot forced RTL and reloaded. In
// Expo Go a JS-level reload does not carry the native RTL flag across, so the
// next boot saw the same mismatch and reloaded again — a relaunch loop that
// ended with Expo Go closing, and no error to show for it. A stored "already
// tried" marker is not a safe guard either, because the key-value store falls
// back to memory when it isn't ready this early, and memory does not survive a
// reload.
//
// So the flag is set and the app simply renders. Text still aligns correctly
// for the locale through `localizedTextAlign`, and the native flip applies on
// the next full launch. Only an explicit language switch by the user restarts
// the app (see `applyLocale`).
syncNativeRTL(initialLocale === 'ar');

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
