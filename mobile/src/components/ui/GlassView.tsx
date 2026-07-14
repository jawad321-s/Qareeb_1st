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
}: GlassViewProps) {
  const { isDark } = useTheme();
  const blur = intensity ?? (isDark ? 55 : 75);

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView intensity={blur} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      {/* Translucent tint so content stays legible over busy backgrounds */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? 'rgba(20,28,46,0.55)' : 'rgba(255,255,255,0.55)' },
        ]}
      />
      {/* Diagonal light sheen */}
      {sheen && (
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']
              : ['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']
          }
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
            borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.9)',
          },
        ]}
      />
      {/* Bright top edge */}
      <LinearGradient
        colors={[isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        style={{ position: 'absolute', top: 0, left: radius, right: radius, height: 1 }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}
