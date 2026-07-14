import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/** A single shimmering placeholder block. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const { isDark } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-200, 200]) }],
  }));

  const base = isDark ? '#1E293B' : '#E2E8F0';
  const highlight = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)';

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: base, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View style={[{ ...StyleSheetAbsolute }, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', highlight, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 200 }}
        />
      </Animated.View>
    </View>
  );
}

const StyleSheetAbsolute = {
  position: 'absolute' as const,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

/** Composed skeleton mimicking a service/request card while data loads. */
export function CardSkeleton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
      }}
    >
      <Skeleton width={56} height={56} radius={16} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="45%" height={12} />
      </View>
    </View>
  );
}
