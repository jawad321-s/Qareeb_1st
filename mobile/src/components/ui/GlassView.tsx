import React from 'react';
import { View, type ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';

interface GlassViewProps {
  children: React.ReactNode;
  intensity?: number;
  radius?: number;
  style?: ViewStyle;
  /** Show the diagonal light sheen (default true) for the "liquid glass" look. */
  sheen?: boolean;
  /**
   * 'auto'    — theme-aware surface glass (cards, tab bar).
   * 'onColor' — for use over gradients/photos: barely-there white veil so the
   *             background color shows through instead of a milky white box.
   */
  tone?: 'auto' | 'onColor';
}

/**
 * A clearly-visible liquid-glass surface: strong blur + a translucent tint,
 * a bright hairline highlight along the top edge, and a diagonal sheen overlay.
 * Works in both light and dark themes.
 */
export function GlassView({
  children,
  intensity,
  radius = 24,
  style,
  sheen = true,
  tone = 'auto',
}: GlassViewProps) {
  const { isDark } = useTheme();
  const onColor = tone === 'onColor';
  const blur = intensity ?? (onColor ? 40 : isDark ? 55 : 75);

  const veil = onColor
    ? 'rgba(255,255,255,0.13)'
    : isDark
      ? 'rgba(20,28,46,0.55)'
      : 'rgba(255,255,255,0.55)';

  const sheenColors: [string, string, string] = onColor
    ? ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']
    : isDark
      ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']
      : ['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)'];

  const hairline = onColor
    ? 'rgba(255,255,255,0.32)'
    : isDark
      ? 'rgba(255,255,255,0.18)'
      : 'rgba(255,255,255,0.9)';

  const topEdge = onColor
    ? 'rgba(255,255,255,0.5)'
    : isDark
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(255,255,255,1)';

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView intensity={blur} tint={onColor || isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      {/* Translucent tint so content stays legible over busy backgrounds */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: veil }]} />
      {/* Diagonal light sheen */}
      {sheen && (
        <LinearGradient
          colors={sheenColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {/* Hairline highlight border */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: hairline,
          },
        ]}
      />
      {/* Bright top edge */}
      <LinearGradient
        colors={[topEdge, 'rgba(255,255,255,0)']}
        style={{ position: 'absolute', top: 0, left: radius, right: radius, height: 1 }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
