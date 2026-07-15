import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const COLORS: Record<Variant, { bg: string; fg: string }> = {
  neutral: { bg: 'rgba(100,116,139,0.15)', fg: '#64748B' },
  primary: { bg: 'rgba(37,99,235,0.15)', fg: '#2563EB' },
  success: { bg: 'rgba(16,185,129,0.15)', fg: '#059669' },
  warning: { bg: 'rgba(245,158,11,0.15)', fg: '#D97706' },
  danger: { bg: 'rgba(239,68,68,0.15)', fg: '#DC2626' },
  info: { bg: 'rgba(59,130,246,0.15)', fg: '#2563EB' },
};

interface BadgeProps {
  label: string;
  variant?: Variant;
  icon?: IconName;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', icon, style }: BadgeProps) {
  const c = COLORS[variant];
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
