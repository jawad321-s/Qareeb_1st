import React from 'react';
import { Pressable, View, type ViewProps, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius, shadows } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  glass?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

/** Rounded surface card — the base container for most content on Qareeb. */
export function Card({
  onPress,
  padded = true,
  elevated = true,
  glass = false,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, isDark } = useTheme();

  const base: ViewStyle = {
    borderRadius: radius.xl,
    backgroundColor: glass ? 'transparent' : colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padded ? 16 : 0,
    overflow: 'hidden',
    ...(elevated ? shadows.md : {}),
  };

  const inner = glass ? (
    <BlurView
      intensity={isDark ? 40 : 60}
      tint={isDark ? 'dark' : 'light'}
      style={{ padding: padded ? 16 : 0 }}
    >
      {children}
    </BlurView>
  ) : (
    children
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, glass && { padding: 0 }, pressed && { opacity: 0.9 }, style]}
        {...rest}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View style={[base, glass && { padding: 0 }, style]} {...rest}>
      {inner}
    </View>
  );
}
