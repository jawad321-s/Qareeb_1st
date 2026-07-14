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

const PLANS = [
  { id: 'free', name: 'Starter', price: 0, period: 'forever', highlight: false, features: ['Receive nearby requests', 'Up to 10 offers / month', 'Standard support'] },
  { id: 'pro', name: 'Pro', price: 49, period: 'month', highlight: true, features: ['Unlimited offers', 'Priority matching', 'Premium badge', 'Analytics dashboard', 'Faster payouts'] },
  { id: 'elite', name: 'Elite', price: 99, period: 'month', highlight: false, features: ['Everything in Pro', 'Top of search results', 'Dedicated account manager', 'Featured on homepage'] },
];

export default function Subscription() {
  const { colors } = useTheme();
  const toast = useToast();
  const [selected, setSelected] = useState('pro');

  return (
    <Screen scroll>
      <Header showBack title="Subscription" />
      <View style={{ alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Text variant="h1" center>
          Grow your business
        </Text>
        <Text variant="body" tone="muted" center style={{ maxWidth: 300 }}>
          Unlock more visibility and win more jobs with a premium plan.
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        {PLANS.map((plan, i) => {
          const active = selected === plan.id;
          return (
            <Animated.View key={plan.id} entering={FadeInDown.delay(i * 80).duration(400)}>
              <View
                onTouchEnd={() => setSelected(plan.id)}
                style={{ borderRadius: 24, borderWidth: 2, borderColor: active ? colors.tint : colors.border, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={plan.highlight ? ['#4F46E5', '#06B6D4'] : [colors.card, colors.card]}
                  style={{ padding: 20, gap: 14 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="h3" tone={plan.highlight ? 'inverse' : 'default'}>
                      {plan.name}
                    </Text>
                    {plan.highlight && <Badge label="Most popular" variant="warning" icon="award" />}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="display" tone={plan.highlight ? 'inverse' : 'default'}>
                      {plan.price === 0 ? 'Free' : `${plan.price}`}
                    </Text>
                    {plan.price > 0 && (
                      <Text variant="body" style={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : colors.muted, marginBottom: 6 }}>
                        SAR / {plan.period}
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
          label={selected === 'free' ? 'Continue with Starter' : `Subscribe to ${PLANS.find((p) => p.id === selected)?.name}`}
          iconRight="arrow-right"
          onPress={() => toast('success', 'Subscription updated')}
        />
        <Text variant="caption" tone="muted" center style={{ marginTop: 12 }}>
          Cancel anytime. Prices include VAT.
        </Text>
      </View>
    </Screen>
  );
}
