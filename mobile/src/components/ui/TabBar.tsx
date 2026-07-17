import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
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
 * Floating liquid-glass tab bar. The active tab shows a glass bubble behind its
 * icon (tinted gradient + specular sheen + bright rim) that springs in on
 * selection. The bubble is rendered INSIDE each tab item — not as a measured,
 * translated overlay — so its position is correct by construction on iOS,
 * Android and web, in both LTR and RTL. (The previous gliding-overlay approach
 * measured child layouts and translated a shared pill; native RTL flipped the
 * coordinate space and left the pill stranded outside the bar.)
 */
export function TabBar({ state, navigation, meta }: BottomTabBarProps & { meta: Record<string, TabMeta> }) {
  const { colors, gradient } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();

  // Only the routes that have tab metadata are shown.
  const items = state.routes
    .map((route, index) => ({ route, index, m: meta[route.name] }))
    .filter((x): x is { route: (typeof state.routes)[number]; index: number; m: TabMeta } => !!x.m);

  return (
    // Clears the Android navigation / gesture area; never hugs the screen edge.
    // Shadow/clip are split across two layers to avoid an iOS gotcha: a view
    // that casts a shadow cannot also clip its children (the shadow forces
    // masksToBounds=false).
    //  • Outer view  → iOS drop shadow only (Android ignores shadow* props).
    //  • GlassView   → rounded clip + Android elevation (iOS ignores elevation).
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom + 10, 35),
        borderRadius: 28,
        shadowColor: shadows.lg.shadowColor,
        shadowOffset: shadows.lg.shadowOffset,
        shadowOpacity: shadows.lg.shadowOpacity,
        shadowRadius: shadows.lg.shadowRadius,
      }}
    >
      <GlassView radius={28} style={{ elevation: shadows.lg.elevation }}>
        <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8 }}>
          {items.map((x) => {
            const focused = x.index === state.index;
            return (
              <TabItem
                key={x.route.key}
                icon={x.m.icon}
                label={t(x.m.label)}
                focused={focused}
                gradient={gradient}
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
  gradient,
  tint,
  inactive,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
  onPress: () => void;
  gradient: readonly [string, string, ...string[]];
  tint: string;
  inactive: string;
}) {
  const reduceMotion = useReducedMotion();
  const bubble = useSharedValue(focused ? 1 : 0);
  const iconScale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    if (reduceMotion) {
      bubble.value = focused ? 1 : 0;
      iconScale.value = 1;
      return;
    }
    bubble.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 220 });
    iconScale.value = withSpring(focused ? 1 : 0.92, { damping: 13, stiffness: 200 });
  }, [focused, reduceMotion, bubble, iconScale]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubble.value,
    transform: [{ scale: 0.6 + 0.4 * bubble.value }],
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ alignItems: 'center', gap: 3 }}>
        <View style={{ width: PILL_W, height: PILL_H, alignItems: 'center', justifyContent: 'center' }}>
          {/* Liquid-glass bubble behind the active icon: tinted glass fill,
              wet-glass sheen and a bright rim. Lives inside the item, so it is
              always exactly under its icon. */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                ...StyleSheet.absoluteFillObject,
                borderRadius: PILL_H / 2,
                overflow: 'hidden',
              },
              bubbleStyle,
            ]}
          >
            <LinearGradient
              colors={[gradient[0], gradient[gradient.length - 1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.65, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: PILL_H / 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' },
              ]}
            />
          </Animated.View>
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
