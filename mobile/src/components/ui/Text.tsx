import React from 'react';
import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';
import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { localizedTextAlign } from '@/i18n/rtl';

type Variant = keyof typeof typography;
type Tone = 'default' | 'muted' | 'primary' | 'success' | 'danger' | 'inverse';

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
  children: React.ReactNode;
}

// HIG "Dynamic Type": text scales with the OS font-size setting (accessibility),
// but we cap the multiplier so fixed-height chrome (buttons, chips, the tab bar)
// can't break its layout at the largest settings. Body copy can raise this.
const DEFAULT_MAX_FONT_SCALE = 1.3;

/** Map an Inter weight to its Cairo (Arabic) equivalent. */
function arabicFont(family?: string) {
  if (family && family.startsWith('Inter')) return family.replace('Inter', 'Cairo');
  return family ?? 'Cairo_400Regular';
}

export function Text({
  variant = 'body',
  tone = 'default',
  center,
  style,
  children,
  maxFontSizeMultiplier = DEFAULT_MAX_FONT_SCALE,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const { isRTL } = useT();
  const toneColor: Record<Tone, string> = {
    default: colors.fg,
    muted: colors.muted,
    primary: colors.tint,
    success: '#10B981',
    danger: '#EF4444',
    inverse: '#FFFFFF',
  };

  // Resolve the effective font family (respecting inline overrides), then swap
  // to the Cairo family when rendering Arabic so glyphs look native and premium.
  const flat = StyleSheet.flatten(style) as { fontFamily?: string } | undefined;
  const baseFamily = flat?.fontFamily ?? typography[variant].fontFamily;
  const fontFamily = isRTL ? arabicFont(baseFamily) : baseFamily;

  // Cairo's Arabic glyphs are taller than Inter's Latin ones (dots and marks sit
  // high above the x-height), so line heights tuned for Inter clip them — ث lost
  // its dots and read as ت in screen titles. Give Arabic text a taller line.
  const base = typography[variant];
  const arabicLineHeight = Math.max(base.lineHeight, Math.round(base.fontSize * 1.65));

  // Default alignment follows the active language. localizedTextAlign returns
  // undefined when the native layout engine already runs in this direction —
  // forcing 'right' there would be flipped to the physical left by RN's RTL
  // style swapping. `center` and any inline `textAlign` still win.
  const align = localizedTextAlign(isRTL);
  return (
    <RNText
      style={[
        base,
        {
          color: toneColor[tone],
          writingDirection: isRTL ? 'rtl' : 'ltr',
          ...(align ? { textAlign: align } : {}),
          ...(isRTL ? { lineHeight: arabicLineHeight } : {}),
        },
        center && { textAlign: 'center' },
        style,
        { fontFamily }, // final override wins for both LTR passthrough and RTL swap
      ]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...rest}
    >
      {children}
    </RNText>
  );
}
