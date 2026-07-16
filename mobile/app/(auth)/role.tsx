import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { radius } from '@/theme/tokens';
import type { UserRole } from '@/types';

interface RoleOption {
  role: UserRole;
  icon: IconName;
  title: string;
  desc: string;
  gradient: [string, string];
}

export default function RolePicker() {
  const { colors } = useTheme();
  const { t } = useT();
  const [selected, setSelected] = useState<UserRole>('customer');

  const options: RoleOption[] = [
    {
      role: 'customer',
      icon: 'search',
      title: t('role.customer.title'),
      desc: t('role.customer.desc'),
      gradient: ['#2563EB', '#0EA5E9'],
    },
    {
      role: 'artisan',
      icon: 'tools',
      title: t('role.artisan.title'),
      desc: t('role.artisan.desc'),
      gradient: ['#EA7509', '#FB923C'],
    },
  ];

  const onContinue = () => {
    router.push({ pathname: '/(auth)/register', params: { role: selected } });
  };

  return (
    <Screen scroll>
      <Header showBack />
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 6, marginBottom: 28 }}>
        <Text variant="h1">{t('role.title')}</Text>
        <Text variant="body" tone="muted">
          {t('role.subtitle')}
        </Text>
      </Animated.View>

      <View style={{ gap: 16 }}>
        {options.map((opt, i) => (
          <Animated.View key={opt.role} entering={FadeInDown.delay(120 + i * 120).duration(500)}>
            <RoleCard
              option={opt}
              active={selected === opt.role}
              onSelect={() => {
                Haptics.selectionAsync().catch(() => {});
                setSelected(opt.role);
              }}
              colors={colors}
            />
          </Animated.View>
        ))}
      </View>

      <Button label={t('common.continue')} iconRight="arrow-right" onPress={onContinue} style={{ marginTop: 28 }} />
    </Screen>
  );
}

function RoleCard({
  option,
  active,
  onSelect,
  colors,
}: {
  option: RoleOption;
  active: boolean;
  onSelect: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, progress]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: active ? option.gradient[0] : colors.border,
    borderWidth: 1.5 + progress.value * 0.5,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={() => (scale.value = withSpring(0.97, { damping: 16, stiffness: 320 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 200 }))}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: 18,
            borderRadius: radius.xl,
            backgroundColor: active ? option.gradient[0] + '12' : colors.surface,
          },
          cardStyle,
        ]}
      >
        <LinearGradient
          colors={option.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name={option.icon} size={28} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="bodyMedium">{option.title}</Text>
          <Text variant="caption" tone="muted">
            {option.desc}
          </Text>
        </View>
        <Animated.View
          style={[
            {
              width: 26,
              height: 26,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: option.gradient[0],
            },
            checkStyle,
          ]}
        >
          <Icon name="check" size={16} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
