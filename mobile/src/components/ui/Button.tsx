import React from 'react';
import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { radius, gradients } from '@/theme/tokens';
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
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;
  const height = HEIGHTS[size];

  const press = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
  };

  return (
    <Animated.View style={[animatedStyle, containerBase, style]}>
      <Pressable
        onPress={press}
        onPressIn={() => (scale.value = withSpring(0.96, { damping: 15 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
        disabled={isDisabled}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {Content}
          </LinearGradient>
        ) : (
          <View
            style={{
              backgroundColor:
                variant === 'danger'
                  ? '#EF4444'
                  : variant === 'secondary'
                    ? colors.surface2
                    : variant === 'outline'
                      ? 'transparent'
                      : 'transparent',
              borderWidth: variant === 'outline' ? 1.5 : 0,
              borderColor: colors.tint,
            }}
          >
            {Content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
