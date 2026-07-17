import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { kv } from '@/lib/mmkv';
import { MOCK_ARTISAN_PROFILE } from '@/mock/data';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const KEY = 'qareeb.artisan.radiusKm';
const OPTIONS = [5, 10, 15, 25, 40];

/** How far from their location the artisan receives job requests. */
export default function ServiceRadius() {
  const { colors } = useTheme();
  const { t } = useT();
  const [radius, setRadius] = useState<number>(() => kv.get<number>(KEY) ?? MOCK_ARTISAN_PROFILE.serviceRadiusKm);

  const choose = (km: number) => {
    setRadius(km);
    kv.set(KEY, km);
  };

  return (
    <Screen scroll>
      <Header showBack title={t('ap.radius')} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 20 }}>
        {t('rad.desc')}
      </Text>

      {/* Current value hero */}
      <Card style={{ alignItems: 'center', paddingVertical: 28, marginBottom: 20 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.tint + '14',
            borderWidth: 2,
            borderColor: colors.tint + '40',
            marginBottom: 12,
          }}
        >
          <Icon name="map-pin" size={34} color={colors.tint} />
        </View>
        <Text variant="overline" tone="muted">
          {t('rad.current')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <Text variant="display" tone="primary" style={{ fontVariant: ['tabular-nums'] }}>
            {radius}
          </Text>
          <Text variant="h3" tone="muted">
            {t('rad.km')}
          </Text>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {OPTIONS.map((km) => {
          const active = km === radius;
          return (
            <Pressable
              key={km}
              onPress={() => choose(km)}
              style={{
                flexGrow: 1,
                minWidth: 96,
                alignItems: 'center',
                paddingVertical: 16,
                borderRadius: 16,
                backgroundColor: active ? colors.tint : colors.surface,
                borderWidth: 1.5,
                borderColor: active ? colors.tint : colors.border,
              }}
            >
              <Text
                variant="bodyMedium"
                style={{
                  color: active ? '#FFFFFF' : colors.fg,
                  fontFamily: 'Inter_600SemiBold',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {km} {t('rad.km')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
