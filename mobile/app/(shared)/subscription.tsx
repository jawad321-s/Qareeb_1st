import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
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
import { PLANS } from '@/lib/plans';
import { useAuth } from '@/store/auth';
import { useMySubscription, useSubscriptionStore } from '@/store/subscription';

export default function Subscription() {
  const { colors, gradient } = useTheme();
  const toast = useToast();
  const { t, locale } = useT();
  const user = useAuth((s) => s.user);
  const current = useMySubscription(user?.uid);
  const activate = useSubscriptionStore((s) => s.activate);
  // Preselect the most popular plan unless the artisan is already on it.
  const [selected, setSelected] = useState<string>(current.planId === 'pro' ? 'elite' : 'pro');
  const chosen = PLANS.find((p) => p.id === selected)!;
  const isCurrent = chosen.id === current.planId;

  const onSubscribe = () => {
    if (!user || isCurrent) return;
    if (chosen.price === 0) {
      // Downgrading to the free plan costs nothing — no checkout needed.
      activate(user.uid, { planId: 'free', amount: 0 });
      toast('success', t('sub.switchedFree'));
      return;
    }
    router.push({ pathname: '/(shared)/checkout', params: { plan: chosen.id } });
  };

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
        {PLANS.map((plan, i) => {
          const active = selected === plan.id;
          const mine = current.planId === plan.id;
          return (
            <Animated.View key={plan.id} entering={FadeInDown.delay(i * 80).duration(400)}>
              <Pressable
                onPress={() => setSelected(plan.id)}
                style={{ borderRadius: 24, borderWidth: 2, borderColor: active ? colors.tint : colors.border, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={plan.highlight ? [gradient[0], gradient[2]] : [colors.card, colors.card]}
                  style={{ padding: 20, gap: 14 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="h3" tone={plan.highlight ? 'inverse' : 'default'}>
                      {plan.name[locale]}
                    </Text>
                    {mine ? (
                      <Badge label={t('sub.current')} variant="success" icon="check-circle" />
                    ) : (
                      plan.highlight && <Badge label={t('sub.popular')} variant="warning" icon="award" />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="display" tone={plan.highlight ? 'inverse' : 'default'}>
                      {plan.price === 0 ? t('sub.free') : `${plan.price / config.currencyMinorPerMajor}`}
                    </Text>
                    {plan.price > 0 && (
                      <Text variant="body" style={{ color: plan.highlight ? 'rgba(255,255,255,0.85)' : colors.muted, marginBottom: 6 }}>
                        {config.currency} / {t('sub.month')}
                      </Text>
                    )}
                  </View>
                  <View style={{ gap: 8 }}>
                    {plan.features[locale].map((f) => (
                      <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon name="check-circle" size={16} color={plan.highlight ? '#FFF' : colors.tint} />
                        <Text variant="caption" tone={plan.highlight ? 'inverse' : 'muted'}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={{ marginTop: 24 }}>
        <Button
          label={
            isCurrent
              ? t('sub.current')
              : chosen.price === 0
                ? t('sub.switchToFree')
                : `${t('sub.subscribe')} ${chosen.name[locale]} · ${t('sub.continuePay')}`
          }
          iconRight={isCurrent ? 'check' : chosen.price === 0 ? 'arrow-right' : 'credit-card'}
          onPress={onSubscribe}
          disabled={isCurrent}
        />
        {current.renewsAt && (
          <Text variant="caption" tone="muted" center style={{ marginTop: 12 }}>
            {PLANS.find((p) => p.id === current.planId)?.name[locale]} · {t('sub.renewsOn')}{' '}
            {new Date(current.renewsAt).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        )}
        <Text variant="caption" tone="muted" center style={{ marginTop: 8 }}>
          {t('sub.cancelAnytime')}
        </Text>
      </View>
    </Screen>
  );
}
