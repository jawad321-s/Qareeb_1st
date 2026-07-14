import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import type { Category } from '@/types';
import { shadows } from '@/theme/tokens';

function shade(hex: string, amount = -24) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amount);
  const g = clamp(((n >> 8) & 0xff) + amount);
  const b = clamp((n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface Props {
  category: Category;
  locale?: 'ar' | 'en';
  onPress?: () => void;
  size?: number;
}

export function CategoryTile({ category, locale = 'en', onPress, size = 72 }: Props) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.92))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={{ alignItems: 'center', gap: 8, width: size + 12 }}
    >
      <Animated.View style={aStyle}>
        <LinearGradient
          colors={[category.colorHex, shade(category.colorHex)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            { width: size, height: size, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
            shadows.sm,
          ]}
        >
          <Icon name={category.icon as any} size={30} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
      <Text variant="caption" center numberOfLines={1} style={{ fontFamily: 'Inter_500Medium' }}>
        {category.name[locale]}
      </Text>
    </Pressable>
  );
}
