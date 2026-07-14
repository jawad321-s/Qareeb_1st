import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text variant="h3">{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text variant="caption" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {actionLabel}
          </Text>
          <Icon name="chevron-right" size={14} color="#6366F1" />
        </Pressable>
      )}
    </View>
  );
}
