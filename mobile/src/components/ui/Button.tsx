import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { radius, gradients, shadows } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const HEIGHTS: Record<Size, number> = { sm: 40, md: 52, lg: 58 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  iconLeft,
  iconRight,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  // Ripple state — a circle grows out from the touch point and fades.
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;
  const height = HEIGHTS[size];

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setDims({ w: width, h });
  };

  const rippleDiameter = Math.max(dims.w, dims.h) * 2.2;

  const rippleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: rippleDiameter,
    height: rippleDiameter,
    borderRadius: rippleDiameter / 2,
    left: rx.value - rippleDiameter / 2,
    top: ry.value - rippleDiameter / 2,
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  const onPressIn = (e: GestureResponderEvent) => {
    if (isDisabled) return;
    rx.value = e.nativeEvent.locationX;
    ry.value = e.nativeEvent.locationY;
    rippleScale.value = 0;
    rippleOpacity.value = 0.35;
    rippleScale.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.ease) });
    rippleOpacity.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.ease) });
    // Deeper press
    scale.value = withSpring(0.93, { damping: 16, stiffness: 320 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const press = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress?.();
  };

  const textTone =
    variant === 'primary' || variant === 'danger'
      ? 'inverse'
      : variant === 'outline' || variant === 'ghost'
        ? 'primary'
        : 'default';

  const contentColor =
    textTone === 'inverse' ? '#FFFFFF' : variant === 'secondary' ? colors.fg : colors.tint;

  // Ripple tint: light over dark buttons, tinted over light ones.
  const rippleColor =
    variant === 'primary' || variant === 'danger'
      ? 'rgba(255,255,255,0.45)'
      : colors.tint + '55';

  const Content = (
    <View
      style={{
        height,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
      }}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {iconLeft && <Icon name={iconLeft} size={18} color={contentColor} />}
          <Text variant="bodyMedium" tone={textTone} style={{ fontFamily: 'Inter_600SemiBold' }}>
            {label}
          </Text>
          {iconRight && <Icon name={iconRight} size={18} color={contentColor} />}
        </>
      )}
    </View>
  );

  const containerBase: ViewStyle = {
    borderRadius: radius.lg,
    overflow: 'hidden',
    opacity: isDisabled ? 0.55 : 1,
    width: fullWidth ? '100%' : undefined,
    // Primary CTAs glow softly in brand color — depth reserved for the action
    // that matters, not sprinkled everywhere.
    ...(variant === 'primary' && !isDisabled ? shadows.brand : {}),
  };

  const Ripple = (
    <Animated.View pointerEvents="none" style={[rippleStyle, { backgroundColor: rippleColor }]} />
  );

  return (
    <Animated.View style={[animatedStyle, containerBase, style]}>
      <Pressable onPress={press} onPressIn={onPressIn} onPressOut={onPressOut} onLayout={onLayout} disabled={isDisabled}>
        {variant === 'primary' ? (
          <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {Content}
            {Ripple}
          </LinearGradient>
        ) : (
          <View
            style={{
              backgroundColor:
                variant === 'danger'
                  ? '#EF4444'
                  : variant === 'secondary'
                    ? colors.surface2
                    : 'transparent',
              borderWidth: variant === 'outline' ? 1.5 : 0,
              borderColor: colors.tint,
            }}
          >
            {Content}
            {Ripple}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
