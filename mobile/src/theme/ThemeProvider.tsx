import { useColorScheme as useRNColorScheme } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { storage } from '@/lib/mmkv';
import { roleAccents, themes, type RoleAccent, type ThemeColors } from './tokens';
import { useAuth } from '@/store/auth';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const THEME_KEY = 'qareeb.theme.mode';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (storage.getString(THEME_KEY) as ThemeMode) ?? 'system',
  setMode: (mode) => {
    storage.set(THEME_KEY, mode);
    set({ mode });
  },
}));

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: 'light' | 'dark';
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
  /** Signed-in role driving the accent (customer = blue, artisan = orange). */
  role: 'customer' | 'artisan';
  /** Role-accented brand gradient for CTAs, active pills, hero fills. */
  gradient: RoleAccent['gradient'];
  gradientSoft: RoleAccent['gradientSoft'];
  hero: readonly [string, string];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useRNColorScheme() ?? 'light';
  const { mode, setMode } = useThemeStore();
  const scheme: 'light' | 'dark' = mode === 'system' ? system : mode;
  const role: 'customer' | 'artisan' = useAuth((s) => (s.user?.role === 'artisan' ? 'artisan' : 'customer'));

  // Keep NativeWind's runtime color scheme in sync with our store. Guarded
  // because some platforms reject manual set unless darkMode is class-based.
  useEffect(() => {
    try {
      nwColorScheme.set(mode);
    } catch {
      // no-op — theme still resolves via our own ThemeProvider context
    }
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => {
    const accent = roleAccents[role];
    const isDark = scheme === 'dark';
    return {
      colors: { ...themes[scheme], tint: isDark ? accent.tintDark : accent.tintLight },
      scheme,
      mode,
      setMode,
      isDark,
      role,
      gradient: accent.gradient,
      gradientSoft: accent.gradientSoft,
      hero: isDark ? accent.heroDark : accent.heroLight,
    };
  }, [scheme, mode, setMode, role]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
