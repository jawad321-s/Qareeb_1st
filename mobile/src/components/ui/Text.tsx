import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
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

  return (
    <RNText
      style={[
        typography[variant],
        { color: toneColor[tone] },
        isRTL && { writingDirection: 'rtl' },
        center ? { textAlign: 'center' } : isRTL ? { textAlign: 'right' } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
