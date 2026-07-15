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
    bg: '#F6F8FB',
    surface: '#FFFFFF',
    surface2: '#EEF2F7',
    card: '#FFFFFF',
    border: '#E5EAF2',
    fg: '#0F172A',
    muted: '#61708A',
    tint: '#2563EB',
    tabInactive: '#94A3B8',
    overlay: 'rgba(15,23,42,0.45)',
  },
  dark: {
    bg: '#0A0F1E',
    surface: '#101827',
    surface2: '#1C2537',
    card: '#121A2B',
    border: '#243046',
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

// Type scale with optical letter-spacing: tight negative tracking on large
// sizes, generous positive tracking on overlines — the discipline that makes
// headings read "designed" rather than default.
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  h1: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 28, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 24, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.25 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular', letterSpacing: 0 },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_500Medium', letterSpacing: -0.1 },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular', letterSpacing: 0 },
  overline: { fontSize: 11, lineHeight: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.7 },
} as const;

// Elevation presets (iOS shadow + Android elevation). Deliberately restrained:
// resting cards get a whisper of depth; only floating surfaces get drama.
export const shadows = {
  none: {},
  sm: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
  },
  // Brand-tinted glow for primary CTAs.
  brand: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

export const gradients = {
  brand: ['#1D4ED8', '#2563EB', '#0EA5E9'] as const,
  brandSoft: ['#3B82F6', '#38BDF8'] as const,
  sunset: ['#F59E0B', '#EF4444'] as const,
  success: ['#10B981', '#0EA5E9'] as const,
  night: ['#0B1120', '#1E293B'] as const,
};
