// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — the single source of truth for spacing, radius, typography,
// shadows and palette. Consumed by both NativeWind classes and imperative styles.
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  accent: { 400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2' },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Semantic colors resolved per color scheme.
export const themes = {
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    fg: '#0F172A',
    muted: '#64748B',
    tint: palette.primary[600],
    tabInactive: '#94A3B8',
    overlay: 'rgba(15,23,42,0.45)',
  },
  dark: {
    bg: '#0B1120',
    surface: '#111827',
    surface2: '#1E293B',
    card: '#141C2E',
    border: '#2A344A',
    fg: '#F1F5F9',
    muted: '#94A3B8',
    tint: palette.primary[400],
    tabInactive: '#64748B',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type ThemeColors = typeof themes.light;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontFamily: 'Inter_700Bold' },
  h1: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold' },
  h2: { fontSize: 22, lineHeight: 28, fontFamily: 'Inter_600SemiBold' },
  h3: { fontSize: 18, lineHeight: 24, fontFamily: 'Inter_600SemiBold' },
  body: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_500Medium' },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  overline: { fontSize: 11, lineHeight: 14, fontFamily: 'Inter_600SemiBold' },
} as const;

// Elevation presets (iOS shadow + Android elevation).
export const shadows = {
  none: {},
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
} as const;

export const gradients = {
  brand: ['#4F46E5', '#6366F1', '#06B6D4'] as const,
  brandSoft: ['#818CF8', '#22D3EE'] as const,
  sunset: ['#F59E0B', '#EF4444'] as const,
  success: ['#10B981', '#06B6D4'] as const,
  night: ['#0B1120', '#1E293B'] as const,
};
