import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import type { Category } from '@/types';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  category: Category;
  locale?: 'ar' | 'en';
  onPress?: () => void;
  size?: number;
}

/**
 * Category tile — soft-tinted surface with the category color reserved for the
 * icon itself. Restraint over saturation: color identifies, it doesn't shout.
 */
export function CategoryTile({ category, locale = 'en', onPress, size = 68 }: Props) {
  const { isDark } = useTheme();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 16, stiffness: 320 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 220 }))}
      style={{ alignItems: 'center', gap: 8, width: size + 16 }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: category.colorHex + (isDark ? '24' : '14'),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: category.colorHex + (isDark ? '55' : '30'),
          },
          aStyle,
        ]}
      >
        <Icon name={category.icon as any} size={26} color={category.colorHex} />
      </Animated.View>
      <Text variant="caption" center numberOfLines={1} style={{ fontFamily: 'Inter_500Medium' }}>
        {category.name[locale]}
      </Text>
    </Pressable>
  );
}
