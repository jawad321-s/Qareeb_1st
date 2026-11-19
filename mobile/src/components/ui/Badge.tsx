import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

// Text colors reach 4.5:1 on their own tint: darker shades on the light theme,
// lighter ones on the dark theme.
const COLORS: Record<Variant, { bg: string; light: string; dark: string }> = {
  neutral: { bg: 'rgba(100,116,139,0.15)', light: '#475569', dark: '#94A3B8' },
  primary: { bg: 'rgba(37,99,235,0.15)', light: '#1D4ED8', dark: '#60A5FA' },
  success: { bg: 'rgba(16,185,129,0.15)', light: '#047857', dark: '#34D399' },
  warning: { bg: 'rgba(245,158,11,0.15)', light: '#B45309', dark: '#FBBF24' },
  danger: { bg: 'rgba(239,68,68,0.15)', light: '#B91C1C', dark: '#F87171' },
  info: { bg: 'rgba(59,130,246,0.15)', light: '#1D4ED8', dark: '#60A5FA' },
};

interface BadgeProps {
  label: string;
  variant?: Variant;
  icon?: IconName;
  style?: ViewStyle;
  /** On a coloured / gradient hero: white text on a translucent white pill. */
  onDark?: boolean;
}

export function Badge({ label, variant = 'neutral', icon, style, onDark }: BadgeProps) {
  const { isDark } = useTheme();
  const base = COLORS[variant];
  const c = onDark ? { bg: 'rgba(0,0,0,0.3)', fg: '#FFFFFF' } : { bg: base.bg, fg: isDark ? base.dark : base.light };
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          backgroundColor: c.bg,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={12} color={c.fg} />}
      <Text variant="overline" style={{ color: c.fg }}>
        {label}
      </Text>
    </View>
  );
}
