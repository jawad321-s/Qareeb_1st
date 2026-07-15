// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — the single source of truth for spacing, radius, typography,
// shadows and palette. Consumed by both NativeWind classes and imperative styles.
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  accent: { 400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7' },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  card: string;
  border: string;
  fg: string;
  muted: string;
  tint: string;
  tabInactive: string;
  overlay: string;
}

// Semantic colors resolved per color scheme.
export const themes: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    fg: '#0F172A',
    muted: '#64748B',
    tint: '#2563EB',
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
    tint: '#60A5FA',
    tabInactive: '#64748B',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

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
  brand: ['#1D4ED8', '#2563EB', '#0EA5E9'] as const,
  brandSoft: ['#3B82F6', '#38BDF8'] as const,
  sunset: ['#F59E0B', '#EF4444'] as const,
  success: ['#10B981', '#0EA5E9'] as const,
  night: ['#0B1120', '#1E293B'] as const,
};
