import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text variant="h3">{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold', color: colors.tint }}>
            {actionLabel}
          </Text>
          <Icon name="chevron-right" size={13} color={colors.tint} />
        </Pressable>
      )}
    </View>
  );
}
