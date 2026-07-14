import React, { useEffect, useState } from 'react';
import { useSharedValue, withTiming, useAnimatedReaction, runOnJS, Easing } from 'react-native-reanimated';
import { Text } from './Text';

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  variant?: React.ComponentProps<typeof Text>['variant'];
  tone?: React.ComponentProps<typeof Text>['tone'];
  style?: React.ComponentProps<typeof Text>['style'];
}

/**
 * Counts up to `value` on mount / when the value changes — a small premium
 * touch for KPIs, income and wallet balances.
 */
export function AnimatedNumber({ value, duration = 900, format, variant = 'h2', tone, style }: Props) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, progress]);

  useAnimatedReaction(
    () => progress.value,
    (v) => runOnJS(setDisplay)(v),
  );

  return (
    <Text variant={variant} tone={tone} style={style}>
      {format ? format(display) : Math.round(display).toLocaleString()}
    </Text>
  );
}
