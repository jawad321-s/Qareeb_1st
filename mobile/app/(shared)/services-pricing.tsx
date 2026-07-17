import React, { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { kv } from '@/lib/mmkv';
import { MOCK_SERVICES, MOCK_ARTISAN_PROFILE } from '@/mock/data';
import { categoryById } from '@/constants/categories';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const KEY = 'qareeb.artisan.servicesPricing';

interface Entry {
  active: boolean;
  /** Minor units (agorot) — same convention as the rest of the app. */
  price: number;
}

type State = Record<string, Entry>;

const PRICE_STEP = 1000; // 10 ₪ per tap keeps editing quick without a keyboard

/** The services this artisan offers, with editable starting prices. */
export default function ServicesPricing() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useT();

  // Show the services in the artisan's categories; seed state from the profile.
  const relevant = MOCK_SERVICES.filter((s) => MOCK_ARTISAN_PROFILE.categoryIds.includes(s.categoryId));
  const [state, setState] = useState<State>(() => {
    const saved = kv.get<State>(KEY);
    if (saved) return saved;
    const seed: State = {};
    for (const s of relevant) {
      seed[s.id] = {
        active: MOCK_ARTISAN_PROFILE.serviceIds.includes(s.id),
        price: MOCK_ARTISAN_PROFILE.basePrices[s.id] ?? s.basePriceFrom,
      };
    }
    return seed;
  });

  const update = (id: string, patch: Partial<Entry>) => {
    const next = { ...state, [id]: { ...state[id], ...patch } };
    setState(next);
    kv.set(KEY, next);
  };

  return (
    <Screen scroll>
      <Header showBack title={t('ap.servicesPricing')} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 16 }}>
        {t('sp.desc')}
      </Text>

      <View style={{ gap: 12 }}>
        {relevant.map((s) => {
          const entry = state[s.id] ?? { active: false, price: s.basePriceFrom };
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
                  value={entry.active}
                  onValueChange={(v) => update(s.id, { active: v })}
                  trackColor={{ true: colors.tint, false: colors.border }}
                  thumbColor="#FFF"
                />
              </View>

              {entry.active && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 14,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                    {t('sp.basePrice')}
                  </Text>
                  <Stepper onPress={() => update(s.id, { price: Math.max(PRICE_STEP, entry.price - PRICE_STEP) })} icon="minus" />
                  <Text
                    variant="bodyMedium"
                    tone="primary"
                    style={{ fontFamily: 'Inter_600SemiBold', minWidth: 74, textAlign: 'center', fontVariant: ['tabular-nums'] }}
                  >
                    {formatMoney(entry.price)}
                  </Text>
                  <Stepper onPress={() => update(s.id, { price: entry.price + PRICE_STEP })} icon="plus" />
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

function Stepper({ onPress, icon }: { onPress: () => void; icon: 'plus' | 'minus' }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Icon name={icon} size={16} color={colors.tint} />
    </Pressable>
  );
}
