import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  editable?: boolean;
  onChange?: (v: number) => void;
  showValue?: boolean;
}

export function Rating({
  value,
  count,
  size = 16,
  editable,
  onChange,
  showValue,
}: RatingProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.round(value);
          const star = (
            <Icon
              name={filled ? 'star-filled' : 'star'}
              size={size}
              color={filled ? '#F59E0B' : '#CBD5E1'}
            />
          );
          return editable ? (
            <Pressable key={i} onPress={() => onChange?.(i)} hitSlop={6}>
              {star}
            </Pressable>
          ) : (
            <View key={i}>{star}</View>
          );
        })}
      </View>
      {showValue && (
        <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {value.toFixed(1)}
        </Text>
      )}
      {count !== undefined && (
        <Text variant="caption" tone="muted">
          ({count})
        </Text>
      )}
    </View>
  );
}
