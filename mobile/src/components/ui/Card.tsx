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
  /** Clip children to the rounded corners. Off by default: on iOS a view can't
   *  both clip AND cast a shadow, and clipping silently kills the shadow, which
   *  made cards look flat. Enable only for cards with full-bleed content. */
  clip?: boolean;
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
  clip = false,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // A crisp border + a soft resting shadow so cards read as raised surfaces.
  // `overflow: hidden` is opt-in (see the `clip` prop) because on iOS it kills
  // the shadow — which is exactly what made cards look flat / not like cards.
  const base: ViewStyle = {
    borderRadius: radius.xl,
    backgroundColor: glass ? 'transparent' : colors.card,
    borderWidth: glass ? 0 : StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: padded ? 16 : 0,
    ...(clip || glass ? { overflow: 'hidden' as const } : {}),
    ...(elevated ? shadows.card : {}),
  };

  const inner = glass ? (
    <GlassView radius={radius.xl} style={{ padding: padded ? 16 : 0 }}>
      {children}
    </GlassView>
  ) : (
    children
  );

  // The card's visual surface ALWAYS renders on a plain View — the pressable
  // variant only wraps it with (transparent) touch handling and a scale spring.
  // Rendering the surface styles on the Pressable itself proved unreliable on
  // native iOS (pressable cards lost their background/border and looked like
  // bare rows), while the plain-View surface renders correctly everywhere.
  const surface = (
    <View style={[base, glass && { padding: 0 }, style]} {...rest}>
      {inner}
    </View>
  );

  if (onPress) {
    const press = () => {
      if (haptic) Haptics.selectionAsync().catch(() => {});
      onPress();
    };
    return (
      <Pressable
        onPress={press}
        onPressIn={() => {
          if (!reduceMotion) scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(1, { damping: 13, stiffness: 200 });
        }}
        style={({ pressed }) => (reduceMotion && pressed ? { opacity: 0.85 } : undefined)}
      >
        <Animated.View style={animatedStyle}>{surface}</Animated.View>
      </Pressable>
    );
  }

  return surface;
}
