import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Hairline border + a whisper of shadow: cards feel crisp at rest instead of
  // floating — heavy uniform shadows are the fastest way to look template-made.
  const base: ViewStyle = {
    borderRadius: radius.xl,
    backgroundColor: glass ? 'transparent' : colors.card,
    borderWidth: glass ? 0 : StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: padded ? 16 : 0,
    overflow: 'hidden',
    ...(elevated ? shadows.sm : {}),
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
          onPressIn={() => {
            if (!reduceMotion) scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
          }}
          onPressOut={() => {
            if (!reduceMotion) scale.value = withSpring(1, { damping: 13, stiffness: 200 });
          }}
          style={({ pressed }) => [
            base,
            glass && { padding: 0 },
            reduceMotion && pressed && { opacity: 0.85 },
            style,
          ]}
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
