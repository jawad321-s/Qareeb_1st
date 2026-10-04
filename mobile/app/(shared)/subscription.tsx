import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { confirmAction } from '@/lib/confirm';
import { PLANS, PLAN_FEATURES, daysLabel, perMonth, planById } from '@/lib/plans';
import { useAuth } from '@/store/auth';
import { useMySubscription, useSubscriptionStore } from '@/store/subscription';

/**
 * Artisan plans: a one-time 7-day free trial (starts automatically), then
 * prepaid 3-month, 6-month and yearly plans. A paid plan can be cancelled; it
 * ends at once and the amount paid is not refunded.
 */
export default function Subscription() {
  const { colors, gradient } = useTheme();
  const toast = useToast();
  const { t, locale } = useT();
  const user = useAuth((s) => s.user);
  const sub = useMySubscription(user?.uid);
  const cancel = useSubscriptionStore((s) => s.cancel);
  const [selected, setSelected] = useState<string>('half');

  if (!user) return null;

  const paid = PLANS.filter((p) => p.price > 0);
  const chosen = planById(selected)!;
  const current = sub.record ? planById(sub.record.planId) : undefined;
  const date = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'long', day: 'numeric' });

  const onCancel = async () => {
    if (!sub.record) return;
    const ok = await confirmAction({
      title: t('sub.cancelTitle'),
      message: `${t('sub.cancelEndsNow')}\n\n${t('sub.noRefund')}: ${formatMoney(sub.record.amount)}`,
      confirmLabel: t('sub.cancelConfirm'),
      cancelLabel: t('sub.keep'),
      destructive: true,
    });
    if (!ok) return;
    cancel(user.uid);
    toast('info', t('sub.cancelledToast'));
  };

  // Status of the artisan's current plan, shown above the list.
  const statusCard = (() => {
    if (sub.status === 'trial' || sub.status === 'active') {
      return (
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="overline" tone="muted">
              {t('sub.yourPlan')}
            </Text>
            <Badge label={sub.status === 'trial' ? t('sub.trialLeft') : t('sub.current')} variant="success" icon="check-circle" />
          </View>
          <Text variant="h2">{current?.name[locale]}</Text>
          <Text variant="caption" tone="muted">
            {t('sub.validUntil')} {date(sub.record!.expiresAt)} · {daysLabel(sub.daysLeft, locale)} {t('sub.left')}
          </Text>
          {sub.isPaid && (
            <>
              <Button label={t('sub.cancel')} iconLeft="x-circle" variant="outline" onPress={onCancel} style={{ marginTop: 6 }} />
              <Text variant="caption" tone="muted" center>
                {t('sub.noRefundNote')}
              </Text>
            </>
          )}
        </Card>
      );
    }
    if (sub.status === 'expired' || sub.status === 'cancelled') {
      return (
        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#EF444412', borderColor: '#EF444444' }}>
          <Icon name="alert-circle" size={22} color="#EF4444" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyMedium">{sub.status === 'cancelled' ? t('sub.cancelledStatus') : t('sub.expired')}</Text>
            <Text variant="caption" tone="muted">
              {t('sub.needPlanBody')}
            </Text>
          </View>
        </Card>
      );
    }
    return null;
  })();

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

      {statusCard}

      {/* What every plan includes — plans differ only in length and price. */}
      <Card style={{ gap: 8, marginTop: 14 }}>
        <Text variant="overline" tone="muted">
          {t('sub.allFeatures')}
        </Text>
        {PLAN_FEATURES[locale].map((f) => (
          <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="check-circle" size={16} color={colors.tint} />
            <Text variant="caption">{f}</Text>
          </View>
        ))}
      </Card>

      {/* Free trial row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
        <Icon name="sparkles" size={22} color={colors.tint} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium">
            {planById('trial')!.name[locale]} · {daysLabel(7, locale)}
          </Text>
          <Text variant="caption" tone="muted">
            {t('sub.trialOnce')}
          </Text>
        </View>
        <Badge
          label={sub.status === 'trial' ? `${daysLabel(sub.daysLeft, locale)} ${t('sub.left')}` : sub.trialUsed ? t('sub.trialUsed') : t('sub.free')}
          variant={sub.status === 'trial' ? 'success' : 'neutral'}
        />
      </View>

      {/* Paid plans */}
      <View style={{ gap: 14, marginTop: 14 }}>
        {paid.map((plan, i) => {
          const active = selected === plan.id;
          const mine = sub.isPaid && sub.record?.planId === plan.id;
          const onGradient = plan.highlight;
          return (
            <Animated.View key={plan.id} entering={FadeInDown.delay(i * 80).duration(400)}>
              <Pressable
                onPress={() => setSelected(plan.id)}
                style={{ borderRadius: 24, borderWidth: 2, borderColor: active ? colors.tint : colors.border, overflow: 'hidden' }}
              >
                <LinearGradient colors={onGradient ? [gradient[0], gradient[2]] : [colors.card, colors.card]} style={{ padding: 20, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="h3" tone={onGradient ? 'inverse' : 'default'}>
                      {plan.name[locale]}
                    </Text>
                    {mine ? (
                      <Badge label={t('sub.current')} variant="success" icon="check-circle" />
                    ) : (
                      plan.badge && <Badge label={plan.badge[locale]} variant="warning" icon="award" />
                    )}
                  </View>
                  <Text variant="display" tone={onGradient ? 'inverse' : 'default'}>
                    {formatMoney(plan.price)}
                  </Text>
                  <Text variant="caption" style={{ color: onGradient ? 'rgba(255,255,255,0.85)' : colors.muted }}>
                    ≈ {formatMoney(perMonth(plan))} / {t('sub.month')}
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={{ marginTop: 24 }}>
        <Button
          label={sub.isPaid ? t('sub.hasActive') : `${t('sub.subscribe')} ${chosen.name[locale]} · ${t('sub.continuePay')}`}
          iconRight={sub.isPaid ? 'check' : 'credit-card'}
          disabled={sub.isPaid}
          onPress={() => router.push({ pathname: '/(shared)/checkout', params: { plan: chosen.id } })}
        />
        <Text variant="caption" tone="muted" center style={{ marginTop: 12 }}>
          {t('sub.prepaid')}
        </Text>
      </View>
    </Screen>
  );
}
