import React from 'react';
import { Pressable, View, type ViewProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GlassView } from './GlassView';
import { radius, shadows } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  glass?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

/** Rounded surface card — the base container for most content on Qareeb.
 *  Pressable cards spring on touch for a tactile, premium feel. */
export function Card({
  onPress,
  padded = true,
  elevated = true,
  glass = false,
  haptic = true,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const base: ViewStyle = {
    borderRadius: radius.xl,
    backgroundColor: glass ? 'transparent' : colors.card,
    borderWidth: glass ? 0 : 1,
    borderColor: colors.border,
    padding: padded ? 16 : 0,
    overflow: 'hidden',
    ...(elevated ? shadows.md : {}),
  };

  const inner = glass ? (
    <GlassView radius={radius.xl} style={{ padding: padded ? 16 : 0 }}>
      {children}
    </GlassView>
  ) : (
    children
  );

  if (onPress) {
    const press = () => {
      if (haptic) Haptics.selectionAsync().catch(() => {});
      onPress();
    };
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={press}
          onPressIn={() => (scale.value = withSpring(0.975, { damping: 18, stiffness: 300 }))}
          onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 220 }))}
          style={[base, glass && { padding: 0 }, style]}
          {...rest}
        >
          {inner}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[base, glass && { padding: 0 }, style]} {...rest}>
      {inner}
    </View>
  );
}
