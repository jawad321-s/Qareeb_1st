import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  data: { label: string; value: number }[];
  height?: number;
}

/** Lightweight animated bar chart (no external deps) for the income screen. */
export function BarChart({ data, height = 160 }: Props) {
  const { colors, gradientSoft } = useTheme();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height, gap: 8 }}>
      {data.map((d, i) => (
        <Bar key={d.label} label={d.label} ratio={d.value / max} index={i} maxHeight={height - 24} muted={colors.muted} gradient={gradientSoft} />
      ))}
    </View>
  );
}

function Bar({ label, ratio, index, maxHeight, muted, gradient }: { label: string; ratio: number; index: number; maxHeight: number; muted: string; gradient: readonly [string, string] }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(index * 70, withTiming(ratio * maxHeight, { duration: 600 }));
  }, [ratio, maxHeight, index, h]);
  const aStyle = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <Animated.View style={[{ width: '70%', borderRadius: 8, overflow: 'hidden' }, aStyle]}>
        <LinearGradient colors={gradient} style={{ flex: 1 }} />
      </Animated.View>
      <Text variant="overline" style={{ color: muted }}>
        {label}
      </Text>
    </View>
  );
}
