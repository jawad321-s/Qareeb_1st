import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Blob {
  size: number;
  colors: [string, string];
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  delay?: number;
  range?: number;
}

/**
 * Slowly drifting, blurred color orbs used behind hero gradients to give the UI
 * a living, premium "liquid" feel. Purely decorative and non-interactive.
 */
function Orb({ blob }: { blob: Blob }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: 6000 + (blob.delay ?? 0), easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [p, blob.delay]);

  const style = useAnimatedStyle(() => {
    const r = blob.range ?? 26;
    return {
      transform: [
        { translateY: interpolate(p.value, [0, 1], [-r, r]) },
        { translateX: interpolate(p.value, [0, 1], [r * 0.6, -r * 0.6]) },
        { scale: interpolate(p.value, [0, 1], [1, 1.12]) },
      ],
    };
  });

  const pos: ViewStyle = {
    position: 'absolute',
    top: blob.top,
    bottom: blob.bottom,
    left: blob.left,
    right: blob.right,
    width: blob.size,
    height: blob.size,
  };

  return (
    <Animated.View style={[pos, style]} pointerEvents="none">
      <LinearGradient
        colors={blob.colors}
        style={{ flex: 1, borderRadius: blob.size / 2, opacity: 0.55 }}
      />
    </Animated.View>
  );
}

export function FloatingBlobs({ blobs, style }: { blobs: Blob[]; style?: ViewStyle }) {
  return (
    <View
      pointerEvents="none"
      style={[{ ...StyleSheetAbsoluteFill, overflow: 'hidden' }, style]}
    >
      {blobs.map((b, i) => (
        <Orb key={i} blob={b} />
      ))}
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

/** Sensible default palette of blobs for a brand hero. */
export const brandBlobs: Blob[] = [
  { size: 220, colors: ['#60A5FA', '#3B82F6'], top: -40, right: -30, delay: 0, range: 30 },
  { size: 180, colors: ['#38BDF8', '#0EA5E9'], bottom: -30, left: -40, delay: 1200, range: 24 },
  { size: 140, colors: ['#60A5FA', '#1D4ED8'], top: 60, left: 40, delay: 2400, range: 18 },
];
