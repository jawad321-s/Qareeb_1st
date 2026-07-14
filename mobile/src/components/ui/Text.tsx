import React from 'react';
import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';
import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

type Variant = keyof typeof typography;
type Tone = 'default' | 'muted' | 'primary' | 'success' | 'danger' | 'inverse';

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
  children: React.ReactNode;
}

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

  return (
    <RNText
      style={[
        typography[variant],
        { color: toneColor[tone] },
        isRTL && { writingDirection: 'rtl' },
        center ? { textAlign: 'center' } : isRTL ? { textAlign: 'right' } : null,
        style,
        { fontFamily }, // final override wins for both LTR passthrough and RTL swap
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
