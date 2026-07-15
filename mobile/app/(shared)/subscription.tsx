import React, { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { config } from '@/lib/config';

const PLANS = {
  en: [
    { id: 'free', name: 'Starter', price: 0, highlight: false, features: ['Receive nearby requests', 'Up to 10 offers / month', 'Standard support'] },
    { id: 'pro', name: 'Pro', price: 49, highlight: true, features: ['Unlimited offers', 'Priority matching', 'Premium badge', 'Analytics dashboard', 'Faster payouts'] },
    { id: 'elite', name: 'Elite', price: 99, highlight: false, features: ['Everything in Pro', 'Top of search results', 'Dedicated account manager', 'Featured on homepage'] },
  ],
  ar: [
    { id: 'free', name: 'المبتدئ', price: 0, highlight: false, features: ['استقبال الطلبات القريبة', 'حتى 10 عروض شهرياً', 'دعم قياسي'] },
    { id: 'pro', name: 'المحترف', price: 49, highlight: true, features: ['عروض غير محدودة', 'أولوية في المطابقة', 'شارة مميّزة', 'لوحة تحليلات', 'دفعات أسرع'] },
    { id: 'elite', name: 'النخبة', price: 99, highlight: false, features: ['كل مزايا المحترف', 'الظهور أعلى نتائج البحث', 'مدير حساب مخصّص', 'ظهور في الصفحة الرئيسية'] },
  ],
};

export default function Subscription() {
  const { colors } = useTheme();
  const toast = useToast();
  const { t, locale } = useT();
  const [selected, setSelected] = useState('pro');
  const plans = PLANS[locale];

  return (
    <Screen scroll>
      <Header showBack title={t('sub.title')} />
      <View style={{ alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Text variant="h1" center>
          {t('sub.grow')}
        </Text>
        <Text variant="body" tone="muted" center style={{ maxWidth: 300 }}>
          {t('sub.growDesc')}
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        {plans.map((plan, i) => {
          const active = selected === plan.id;
          return (
            <Animated.View key={plan.id} entering={FadeInDown.delay(i * 80).duration(400)}>
              <View
                onTouchEnd={() => setSelected(plan.id)}
                style={{ borderRadius: 24, borderWidth: 2, borderColor: active ? colors.tint : colors.border, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={plan.highlight ? ['#2563EB', '#0EA5E9'] : [colors.card, colors.card]}
                  style={{ padding: 20, gap: 14 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="h3" tone={plan.highlight ? 'inverse' : 'default'}>
                      {plan.name}
                    </Text>
                    {plan.highlight && <Badge label={t('sub.popular')} variant="warning" icon="award" />}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="display" tone={plan.highlight ? 'inverse' : 'default'}>
                      {plan.price === 0 ? t('sub.free') : `${plan.price}`}
                    </Text>
                    {plan.price > 0 && (
                      <Text variant="body" style={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : colors.muted, marginBottom: 6 }}>
                        {config.currency} / {t('sub.month')}
                      </Text>
                    )}
                  </View>
                  <View style={{ gap: 8 }}>
                    {plan.features.map((f) => (
                      <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon name="check-circle" size={16} color={plan.highlight ? '#FFF' : colors.tint} />
                        <Text variant="caption" tone={plan.highlight ? 'inverse' : 'muted'}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <View style={{ marginTop: 24 }}>
        <Button
          label={`${t('sub.subscribe')} ${plans.find((p) => p.id === selected)?.name}`}
          iconRight="arrow-right"
          onPress={() => toast('success', 'Subscription updated')}
        />
        <Text variant="caption" tone="muted" center style={{ marginTop: 12 }}>
          {t('sub.cancelAnytime')}
        </Text>
      </View>
    </Screen>
  );
}
