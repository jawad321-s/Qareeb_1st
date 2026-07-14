import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { gradients } from '@/theme/tokens';

interface TabMeta {
  icon: IconName;
  label: string;
}

/** Floating glass tab bar. Pass `meta` mapping route name → icon/label. */
export function TabBar({ state, navigation, meta }: BottomTabBarProps & { meta: Record<string, TabMeta> }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 8 }}>
      <BlurView
        intensity={isDark ? 40 : 70}
        tint={isDark ? 'dark' : 'light'}
        style={{
          flexDirection: 'row',
          borderRadius: 26,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? 'rgba(20,28,46,0.6)' : 'rgba(255,255,255,0.6)',
          paddingVertical: 10,
          paddingHorizontal: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const m = meta[route.name];
          if (!m) return null;
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              icon={m.icon}
              label={m.label}
              focused={focused}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              tint={colors.tint}
              inactive={colors.tabInactive}
            />
          );
        })}
      </BlurView>
    </View>
  );
}

function TabItem({
  icon,
  label,
  focused,
  onPress,
  tint,
  inactive,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
  onPress: () => void;
  tint: string;
  inactive: string;
}) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  scale.value = withSpring(focused ? 1 : 0.9, { damping: 14 });
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center' }}>
      <Animated.View style={[{ alignItems: 'center', gap: 3 }, aStyle]}>
        {focused ? (
          <LinearGradient
            colors={gradients.brand}
            style={{ width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={icon} size={20} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={{ width: 44, height: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={20} color={inactive} />
          </View>
        )}
        <Text variant="overline" style={{ color: focused ? tint : inactive, fontSize: 10 }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
