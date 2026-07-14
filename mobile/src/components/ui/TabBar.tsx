import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { GlassView } from './GlassView';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';
import { gradients, shadows } from '@/theme/tokens';

interface TabMeta {
  icon: IconName;
  label: TranslationKey;
}

/** Floating liquid-glass tab bar with a springy, glowing active pill. */
export function TabBar({ state, navigation, meta }: BottomTabBarProps & { meta: Record<string, TabMeta> }) {
  const { colors } = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 8 }}>
      <GlassView radius={28} style={shadows.lg}>
        <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8 }}>
          {state.routes.map((route, index) => {
            const m = meta[route.name];
            if (!m) return null;
            const focused = state.index === index;
            return (
              <TabItem
                key={route.key}
                icon={m.icon}
                label={t(m.label)}
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
  const glow = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, { damping: 13, stiffness: 180 });
    glow.value = withTiming(focused ? 1 : 0, { duration: 260 });
  }, [focused, scale, glow]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));
  const iconWrapStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center' }}>
      <View style={{ alignItems: 'center', gap: 3 }}>
        <View style={{ width: 46, height: 34, alignItems: 'center', justifyContent: 'center' }}>
          {/* Glowing active pill (fades/springs in) */}
          <Animated.View
            style={[
              { position: 'absolute', width: 46, height: 34, borderRadius: 17, overflow: 'hidden' },
              {
                shadowColor: '#6366F1',
                shadowOpacity: 0.5,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              },
              pillStyle,
            ]}
          >
            <LinearGradient colors={gradients.brand} style={{ flex: 1 }} />
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
