import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

/** Branded 404 — any unknown deep link lands here instead of a blank screen. */
export default function NotFound() {
  const { colors } = useTheme();
  const { t } = useT();

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 60 }}>
        <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', gap: 20 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.tint + '14',
            }}
          >
            <Icon name="map-pin" size={42} color={colors.tint} />
          </View>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text variant="h1" center>
              {t('nf.title')}
            </Text>
            <Text variant="body" tone="muted" center style={{ maxWidth: 280 }}>
              {t('nf.desc')}
            </Text>
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ width: '100%', maxWidth: 320 }}>
          <Button label={t('nf.home')} iconLeft="home" onPress={() => router.replace('/')} />
        </Animated.View>
      </View>
    </Screen>
  );
}
