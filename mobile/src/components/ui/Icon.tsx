import React from 'react';
import { I18nManager } from 'react-native';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

// Directional glyphs must mirror in RTL (back arrows point right, chevrons
// flip) — the layout engine flips positions but never the artwork itself.
const MIRRORED_IN_RTL: ReadonlySet<string> = new Set([
  'chevron-right', 'chevron-left', 'arrow-left', 'arrow-right', 'send', 'log-out',
]);

// Curated Feather-style icon set (24×24 grid, stroke-based). Keys are referenced
// by categories, tab bars and UI throughout the app.
export type IconName =
  | 'home' | 'search' | 'plus' | 'user' | 'bell' | 'message' | 'settings'
  | 'chevron-right' | 'chevron-left' | 'chevron-down' | 'arrow-left' | 'arrow-right'
  | 'star' | 'star-filled' | 'heart' | 'heart-filled' | 'map-pin' | 'clock'
  | 'check' | 'check-circle' | 'x' | 'x-circle' | 'filter' | 'sliders'
  | 'camera' | 'image' | 'mic' | 'send' | 'phone' | 'navigation' | 'wallet'
  | 'shield' | 'award' | 'trending-up' | 'calendar' | 'eye' | 'eye-off'
  | 'lock' | 'mail' | 'edit' | 'trash' | 'log-out' | 'moon' | 'sun' | 'globe'
  | 'droplet' | 'zap' | 'hammer' | 'wind' | 'paintbrush' | 'sparkles'
  | 'wrench' | 'tools' | 'plug' | 'leaf' | 'satellite' | 'truck' | 'briefcase'
  | 'more-horizontal' | 'info' | 'alert-circle' | 'help-circle' | 'flag';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 2 }: IconProps) {
  const { colors } = useTheme();
  const c = color ?? colors.fg;
  const p = { stroke: c, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const mirror = I18nManager.isRTL && MIRRORED_IN_RTL.has(name);

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={mirror ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      {renderPaths(name, c, p)}
    </Svg>
  );
}

function renderPaths(name: IconName, c: string, p: object) {
  switch (name) {
    case 'home': return <><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...p} /><Polyline points="9 22 9 12 15 12 15 22" {...p} /></>;
    case 'search': return <><Circle cx="11" cy="11" r="8" {...p} /><Line x1="21" y1="21" x2="16.65" y2="16.65" {...p} /></>;
    case 'plus': return <><Line x1="12" y1="5" x2="12" y2="19" {...p} /><Line x1="5" y1="12" x2="19" y2="12" {...p} /></>;
    case 'user': return <><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...p} /><Circle cx="12" cy="7" r="4" {...p} /></>;
    case 'bell': return <><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...p} /><Path d="M13.73 21a2 2 0 0 1-3.46 0" {...p} /></>;
    case 'message': return <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" {...p} />;
    case 'settings': return <><Circle cx="12" cy="12" r="3" {...p} /><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 5.4 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...p} /></>;
    case 'chevron-right': return <Polyline points="9 18 15 12 9 6" {...p} />;
    case 'chevron-left': return <Polyline points="15 18 9 12 15 6" {...p} />;
    case 'chevron-down': return <Polyline points="6 9 12 15 18 9" {...p} />;
    case 'arrow-left': return <><Line x1="19" y1="12" x2="5" y2="12" {...p} /><Polyline points="12 19 5 12 12 5" {...p} /></>;
    case 'arrow-right': return <><Line x1="5" y1="12" x2="19" y2="12" {...p} /><Polyline points="12 5 19 12 12 19" {...p} /></>;
    case 'star': return <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" {...p} />;
    case 'star-filled': return <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={c} stroke={c} strokeLinejoin="round" />;
    case 'heart': return <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" {...p} />;
    case 'heart-filled': return <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={c} stroke={c} strokeLinejoin="round" />;
    case 'map-pin': return <><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" {...p} /><Circle cx="12" cy="10" r="3" {...p} /></>;
    case 'clock': return <><Circle cx="12" cy="12" r="10" {...p} /><Polyline points="12 6 12 12 16 14" {...p} /></>;
    case 'check': return <Polyline points="20 6 9 17 4 12" {...p} />;
    case 'check-circle': return <><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" {...p} /><Polyline points="22 4 12 14.01 9 11.01" {...p} /></>;
    case 'x': return <><Line x1="18" y1="6" x2="6" y2="18" {...p} /><Line x1="6" y1="6" x2="18" y2="18" {...p} /></>;
    case 'x-circle': return <><Circle cx="12" cy="12" r="10" {...p} /><Line x1="15" y1="9" x2="9" y2="15" {...p} /><Line x1="9" y1="9" x2="15" y2="15" {...p} /></>;
    case 'filter': return <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" {...p} />;
    case 'sliders': return <><Line x1="4" y1="21" x2="4" y2="14" {...p} /><Line x1="4" y1="10" x2="4" y2="3" {...p} /><Line x1="12" y1="21" x2="12" y2="12" {...p} /><Line x1="12" y1="8" x2="12" y2="3" {...p} /><Line x1="20" y1="21" x2="20" y2="16" {...p} /><Line x1="20" y1="12" x2="20" y2="3" {...p} /><Line x1="1" y1="14" x2="7" y2="14" {...p} /><Line x1="9" y1="8" x2="15" y2="8" {...p} /><Line x1="17" y1="16" x2="23" y2="16" {...p} /></>;
    case 'camera': return <><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" {...p} /><Circle cx="12" cy="13" r="4" {...p} /></>;
    case 'image': return <><Rect x="3" y="3" width="18" height="18" rx="2" ry="2" {...p} /><Circle cx="8.5" cy="8.5" r="1.5" {...p} /><Polyline points="21 15 16 10 5 21" {...p} /></>;
    case 'mic': return <><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" {...p} /><Path d="M19 10v2a7 7 0 0 1-14 0v-2" {...p} /><Line x1="12" y1="19" x2="12" y2="23" {...p} /></>;
    case 'send': return <><Line x1="22" y1="2" x2="11" y2="13" {...p} /><Polygon points="22 2 15 22 11 13 2 9 22 2" {...p} /></>;
    case 'phone': return <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" {...p} />;
    case 'navigation': return <Polygon points="3 11 22 2 13 21 11 13 3 11" {...p} />;
    case 'wallet': return <><Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" {...p} /><Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" {...p} /><Path d="M18 12a2 2 0 0 0 0 4h4v-4z" {...p} /></>;
    case 'shield': return <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />;
    case 'award': return <><Circle cx="12" cy="8" r="7" {...p} /><Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" {...p} /></>;
    case 'trending-up': return <><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" {...p} /><Polyline points="17 6 23 6 23 12" {...p} /></>;
    case 'calendar': return <><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" {...p} /><Line x1="16" y1="2" x2="16" y2="6" {...p} /><Line x1="8" y1="2" x2="8" y2="6" {...p} /><Line x1="3" y1="10" x2="21" y2="10" {...p} /></>;
    case 'eye': return <><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...p} /><Circle cx="12" cy="12" r="3" {...p} /></>;
    case 'eye-off': return <><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" {...p} /><Line x1="1" y1="1" x2="23" y2="23" {...p} /></>;
    case 'lock': return <><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" {...p} /><Path d="M7 11V7a5 5 0 0 1 10 0v4" {...p} /></>;
    case 'mail': return <><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" {...p} /><Polyline points="22,6 12,13 2,6" {...p} /></>;
    case 'edit': return <><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" {...p} /><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" {...p} /></>;
    case 'trash': return <><Polyline points="3 6 5 6 21 6" {...p} /><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...p} /></>;
    case 'log-out': return <><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...p} /><Polyline points="16 17 21 12 16 7" {...p} /><Line x1="21" y1="12" x2="9" y2="12" {...p} /></>;
    case 'moon': return <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" {...p} />;
    case 'sun': return <><Circle cx="12" cy="12" r="5" {...p} /><Line x1="12" y1="1" x2="12" y2="3" {...p} /><Line x1="12" y1="21" x2="12" y2="23" {...p} /><Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" {...p} /><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" {...p} /><Line x1="1" y1="12" x2="3" y2="12" {...p} /><Line x1="21" y1="12" x2="23" y2="12" {...p} /><Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" {...p} /><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" {...p} /></>;
    case 'globe': return <><Circle cx="12" cy="12" r="10" {...p} /><Line x1="2" y1="12" x2="22" y2="12" {...p} /><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" {...p} /></>;
    case 'droplet': return <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" {...p} />;
    case 'zap': return <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" {...p} />;
    case 'hammer': return <><Path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" {...p} /><Path d="M17.64 15L22 10.64" {...p} /><Path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h.86c.85 0 1.65.33 2.25.93l1.25 1.25" {...p} /></>;
    case 'wind': return <Path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" {...p} />;
    case 'paintbrush': return <><Path d="M18.37 2.63L14 7l-1.87-1.87a2.12 2.12 0 0 1 0-3L14.13.63a2.12 2.12 0 0 1 3 0z" {...p} /><Path d="M9 8c-2 2-3 3.5-3 6 0 1-1 2-2 2-1.5 0-3-2-3-4 0-3 2.5-6 5-8" {...p} /><Path d="M14.5 17.5L4.5 27.5" {...p} /></>;
    case 'sparkles': return <><Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" {...p} /><Path d="M19 15l.9 2.4L22 18l-2.1.6L19 21l-.9-2.4L16 18l2.1-.6L19 15z" {...p} /></>;
    case 'wrench': return <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" {...p} />;
    case 'tools': return <><Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" {...p} /></>;
    case 'plug': return <><Path d="M12 22v-5" {...p} /><Path d="M9 8V2" {...p} /><Path d="M15 8V2" {...p} /><Path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z" {...p} /></>;
    case 'leaf': return <><Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" {...p} /><Path d="M2 21c0-3 1.85-5.36 5.08-6" {...p} /></>;
    case 'satellite': return <><Path d="M13 7L9 3 5 7l4 4" {...p} /><Path d="M17 11l4 4-4 4-4-4" {...p} /><Path d="M8 12l4 4" {...p} /><Path d="M16 8l-4-4" {...p} /><Circle cx="12" cy="12" r="1" {...p} /></>;
    case 'truck': return <><Rect x="1" y="3" width="15" height="13" {...p} /><Polygon points="16 8 20 8 23 11 23 16 16 16 16 8" {...p} /><Circle cx="5.5" cy="18.5" r="2.5" {...p} /><Circle cx="18.5" cy="18.5" r="2.5" {...p} /></>;
    case 'briefcase': return <><Rect x="2" y="7" width="20" height="14" rx="2" ry="2" {...p} /><Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" {...p} /></>;
    case 'more-horizontal': return <><Circle cx="12" cy="12" r="1" fill={c} {...p} /><Circle cx="19" cy="12" r="1" fill={c} {...p} /><Circle cx="5" cy="12" r="1" fill={c} {...p} /></>;
    case 'info': return <><Circle cx="12" cy="12" r="10" {...p} /><Line x1="12" y1="16" x2="12" y2="12" {...p} /><Line x1="12" y1="8" x2="12.01" y2="8" {...p} /></>;
    case 'alert-circle': return <><Circle cx="12" cy="12" r="10" {...p} /><Line x1="12" y1="8" x2="12" y2="12" {...p} /><Line x1="12" y1="16" x2="12.01" y2="16" {...p} /></>;
    case 'help-circle': return <><Circle cx="12" cy="12" r="10" {...p} /><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" {...p} /><Line x1="12" y1="17" x2="12.01" y2="17" {...p} /></>;
    case 'flag': return <><Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" {...p} /><Line x1="4" y1="22" x2="4" y2="15" {...p} /></>;
    default: return null;
  }
}
