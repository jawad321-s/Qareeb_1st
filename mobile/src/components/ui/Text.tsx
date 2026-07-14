import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

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
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
