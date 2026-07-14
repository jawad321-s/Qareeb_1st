import { useColorScheme as useRNColorScheme } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { storage } from '@/lib/mmkv';
import { themes, type ThemeColors } from './tokens';

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
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useRNColorScheme() ?? 'light';
  const { mode, setMode } = useThemeStore();
  const scheme: 'light' | 'dark' = mode === 'system' ? system : mode;

  // Keep NativeWind's runtime color scheme in sync with our store.
  useEffect(() => {
    nwColorScheme.set(mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: themes[scheme],
      scheme,
      mode,
      setMode,
      isDark: scheme === 'dark',
    }),
    [scheme, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
