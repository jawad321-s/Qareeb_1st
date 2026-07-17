import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { kv } from '@/lib/mmkv';
import { MOCK_ARTISAN_PROFILE } from '@/mock/data';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';

const KEY = 'qareeb.artisan.availability';

interface Availability {
  days: number[]; // 0 = Sunday … 6 = Saturday
  from: string;
  to: string;
}

const HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

/** Weekly working days + hours customers can book the artisan in. */
export default function AvailabilityScreen() {
  const { colors } = useTheme();
  const { t } = useT();
  const [av, setAv] = useState<Availability>(() => kv.get<Availability>(KEY) ?? { ...MOCK_ARTISAN_PROFILE.availability });

  const save = (next: Availability) => {
    setAv(next);
    kv.set(KEY, next);
  };

  const toggleDay = (d: number) => {
    const days = av.days.includes(d) ? av.days.filter((x) => x !== d) : [...av.days, d].sort();
    if (days.length === 0) return; // keep at least one working day
    save({ ...av, days });
  };

  return (
    <Screen scroll>
      <Header showBack title={t('ap.availability')} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 20 }}>
        {t('av.desc')}
      </Text>

      <Card style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const active = av.days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(d)}
                style={{
                  flexGrow: 1,
                  minWidth: 74,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 13,
                  backgroundColor: active ? colors.tint : colors.surface2,
                  borderWidth: 1.5,
                  borderColor: active ? colors.tint : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{ color: active ? '#FFFFFF' : colors.muted, fontFamily: 'Inter_600SemiBold' }}
                >
                  {t(`av.day${d}` as TranslationKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <HourPicker label={t('av.from')} value={av.from} onChange={(h) => save({ ...av, from: h })} />
      <View style={{ height: 16 }} />
      <HourPicker label={t('av.to')} value={av.to} onChange={(h) => save({ ...av, to: h })} />
    </Screen>
  );
}

function HourPicker({ label, value, onChange }: { label: string; value: string; onChange: (h: string) => void }) {
  const { colors } = useTheme();
  return (
    <Card>
      <Text variant="overline" tone="muted" style={{ marginBottom: 10 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {HOURS.map((h) => {
          const active = h === value;
          return (
            <Pressable
              key={h}
              onPress={() => onChange(h)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: active ? colors.tint : colors.surface2,
              }}
            >
              <Text
                variant="caption"
                style={{
                  color: active ? '#FFFFFF' : colors.muted,
                  fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {h}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
