import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { kv } from '@/lib/mmkv';
import { MOCK_SERVICES, MOCK_ARTISAN_PROFILE } from '@/mock/data';
import { categoryById } from '@/constants/categories';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const KEY = 'qareeb.artisan.services';

/** Which of the artisan's services are offered. No prices here: an artisan
 *  names a price only when quoting a specific request (the offer form). */
type State = Record<string, boolean>;

/** The services this artisan offers. */
export default function MyServices() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useT();

  // Show the services in the artisan's categories; seed state from the profile.
  const relevant = MOCK_SERVICES.filter((s) => MOCK_ARTISAN_PROFILE.categoryIds.includes(s.categoryId));
  const [state, setState] = useState<State>(() => {
    const saved = kv.get<State>(KEY);
    if (saved && Object.values(saved).every((v) => typeof v === 'boolean')) return saved;
    const seed: State = {};
    for (const s of relevant) seed[s.id] = MOCK_ARTISAN_PROFILE.serviceIds.includes(s.id);
    return seed;
  });

  const toggle = (id: string, active: boolean) => {
    const next = { ...state, [id]: active };
    setState(next);
    kv.set(KEY, next);
  };

  return (
    <Screen scroll>
      <Header showBack title={t('ap.services')} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 16 }}>
        {t('sp.desc')}
      </Text>

      <View style={{ gap: 12 }}>
        {relevant.map((s) => {
          const active = state[s.id] ?? false;
          const cat = categoryById(s.categoryId);
          const color = cat?.colorHex ?? colors.tint;
          return (
            <Card key={s.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: color + (isDark ? '26' : '14'),
                  }}
                >
                  <Icon name={s.icon as any} size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {s.name[locale]}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {s.description[locale]}
                  </Text>
                </View>
                <Switch
                  value={active}
                  onValueChange={(v) => toggle(s.id, v)}
                  trackColor={{ true: colors.tint, false: colors.border }}
                  thumbColor="#FFF"
                />
              </View>

            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
