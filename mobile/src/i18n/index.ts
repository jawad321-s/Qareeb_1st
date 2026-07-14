import { create } from 'zustand';
import { storage } from '@/lib/mmkv';
import { config } from '@/lib/config';
import type { Locale } from '@/types';
import { translations, type TranslationKey } from './translations';

const LOCALE_KEY = 'qareeb.locale';

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
}

/** Persisted app language. Defaults to Arabic. */
export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: (storage.getString(LOCALE_KEY) as Locale) ?? config.defaultLocale,
  setLocale: (locale) => {
    storage.set(LOCALE_KEY, locale);
    set({ locale });
  },
  toggle: () => {
    const next: Locale = get().locale === 'ar' ? 'en' : 'ar';
    storage.set(LOCALE_KEY, next);
    set({ locale: next });
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
