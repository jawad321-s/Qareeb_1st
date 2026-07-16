import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutRectangle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { GlassView } from './GlassView';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';
import { shadows } from '@/theme/tokens';

interface TabMeta {
  icon: IconName;
  label: TranslationKey;
}

/** Height of the floating bar itself (glass container). */
export const TAB_BAR_HEIGHT = 74;

/**
 * Vertical space a tab screen must leave at the bottom so its content (lists,
 * pinned action buttons) clears the floating bar and the Android nav area.
 */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom + 10, 35) + TAB_BAR_HEIGHT;
}

const PILL_W = 54;
const PILL_H = 40;

/**
 * Floating liquid-glass tab bar. A single glass pill glides between tabs with a
 * spring (Instagram / iOS-26 feel) — positions are measured from real layout so
 * it's correct in both LTR and RTL.
 */
export function TabBar({ state, navigation, meta }: BottomTabBarProps & { meta: Record<string, TabMeta> }) {
  const { colors, gradient, isDark } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();

  // Only the routes that have tab metadata are shown.
  const items = state.routes
    .map((route, index) => ({ route, index, m: meta[route.name] }))
    .filter((x): x is { route: (typeof state.routes)[number]; index: number; m: TabMeta } => !!x.m);

  const activeVisible = Math.max(0, items.findIndex((x) => x.index === state.index));

  // Measured centre-x of each visible tab (accounts for RTL flex order).
  const [layouts, setLayouts] = useState<Record<number, LayoutRectangle>>({});
  const pillX = useSharedValue(0);
  const ready = useSharedValue(0);

  useEffect(() => {
    const l = layouts[activeVisible];
    if (!l) return;
    const target = l.x + l.width / 2 - PILL_W / 2;
    if (ready.value === 0) {
      pillX.value = target; // first placement without animation
      ready.value = 1;
    } else {
      pillX.value = withSpring(target, { damping: 16, stiffness: 170, mass: 0.7 });
    }
  }, [activeVisible, layouts, pillX, ready]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    opacity: ready.value,
  }));

  return (
    // Clears the Android navigation / gesture area; never hugs the screen edge.
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom + 10, 35) }}>
      <GlassView radius={28} style={shadows.lg}>
        <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8 }}>
          {/* The single gliding liquid-glass lens, behind the icons: extra blur,
              a tinted translucent fill, a diagonal specular sheen and a bright
              rim — a glass bubble that slides between tabs (WhatsApp / iOS-26). */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 10,
                left: 0,
                width: PILL_W,
                height: PILL_H,
                borderRadius: PILL_H / 2,
                overflow: 'hidden',
                shadowColor: colors.tint,
                shadowOpacity: 0.55,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 7,
              },
              pillStyle,
            ]}
          >
            <BlurView intensity={isDark ? 30 : 45} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            {/* Tinted glass fill (translucent so the bar shows through the lens) */}
            <LinearGradient
              colors={[gradient[0] + 'F2', gradient[gradient.length - 1] + 'DE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Specular sheen — the wet-glass highlight */}
            <LinearGradient
              colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Bright rim (glass edge) */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: PILL_H / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
              ]}
            />
          </Animated.View>

          {items.map((x, visibleIndex) => {
            const focused = x.index === state.index;
            return (
              <TabItem
                key={x.route.key}
                icon={x.m.icon}
                label={t(x.m.label)}
                focused={focused}
                onLayout={(rect) => setLayouts((prev) => (prev[visibleIndex]?.x === rect.x ? prev : { ...prev, [visibleIndex]: rect }))}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  const event = navigation.emit({ type: 'tabPress', target: x.route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(x.route.name);
                }}
                tint={colors.tint}
                inactive={colors.tabInactive}
              />
            );
          })}
        </View>
      </GlassView>
    </View>
  );
}

function TabItem({
  icon,
  label,
  focused,
  onPress,
  onLayout,
  tint,
  inactive,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
  onPress: () => void;
  onLayout: (rect: LayoutRectangle) => void;
  tint: string;
  inactive: string;
}) {
  const scale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 13, stiffness: 200 });
  }, [focused, scale]);

  const iconWrapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} onLayout={(e) => onLayout(e.nativeEvent.layout)} style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ alignItems: 'center', gap: 3 }}>
        <View style={{ width: PILL_W, height: PILL_H, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={iconWrapStyle}>
            <Icon name={icon} size={20} color={focused ? '#FFFFFF' : inactive} />
          </Animated.View>
        </View>
        <Text variant="overline" style={{ color: focused ? tint : inactive, fontSize: 10 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
