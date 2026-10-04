import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/store/auth';
import { useSubscriptionStore, type SubscriptionRecord } from '@/store/subscription';
import { planById } from '@/lib/plans';
import { formatMoney } from '@/lib/format';
import {
  TEST_CARDS, cardBrand, digitsOnly, formatCardNumber, formatExpiry, processPayment, validateCard,
  type CardInput, type DeclineReason,
} from '@/lib/payment';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

type Phase = 'form' | 'processing' | 'success' | 'failed';

const BRAND_LABEL = { visa: 'VISA', mastercard: 'Mastercard', unknown: '' } as const;

/**
 * Checkout for a paid artisan plan, backed by the payment SIMULATOR in
 * `lib/payment.ts` — no real charge is made and card details stay on the
 * device (only brand + last four are kept for the receipt).
 */
export default function Checkout() {
  const { colors, gradient } = useTheme();
  const { t, locale } = useT();
  const { plan: planId } = useLocalSearchParams<{ plan: string }>();
  const plan = planById(planId ?? '');
  const user = useAuth((s) => s.user);
  const activate = useSubscriptionStore((s) => s.activate);

  const [card, setCard] = useState<CardInput>({ number: '', holder: '', expiry: '', cvv: '' });
  const [showErrors, setShowErrors] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [step, setStep] = useState(0);
  const [receipt, setReceipt] = useState<SubscriptionRecord | null>(null);
  const [failure, setFailure] = useState<DeclineReason | null>(null);

  // A payment in flight must not be abandoned halfway with the back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => phase === 'processing');
    return () => sub.remove();
  }, [phase]);

  // Walk the progress steps while the (simulated) bank authorizes the charge.
  useEffect(() => {
    if (phase !== 'processing') return;
    setStep(0);
    const a = setTimeout(() => setStep(1), 750);
    const b = setTimeout(() => setStep(2), 1500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [phase]);

  if (!user || !plan || plan.price === 0) return null;

  const errors = validateCard(card);
  const brand = cardBrand(card.number);
  const set = (k: keyof CardInput) => (v: string) => setCard((c) => ({ ...c, [k]: v }));

  const pay = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length > 0) return;
    setPhase('processing');
    const result = await processPayment(card, plan.price);
    if (!result.ok) {
      setFailure(result.reason);
      // Like a real checkout: keep the card, but make the user re-enter the CVV.
      setCard((c) => ({ ...c, cvv: '' }));
      setShowErrors(false);
      setPhase('failed');
      return;
    }
    const sub = activate(user.uid, {
      planId: plan.id,
      amount: plan.price,
      brand: result.brand,
      last4: result.last4,
      transactionId: result.transactionId,
      activatedAt: result.paidAt,
    });
    // (The store also records it in Firestore for the admin dashboard.)
    setReceipt(sub);
    setPhase('success');
  };

  const date = (ts: number) => new Date(ts).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Processing ──────────────────────────────────────────────────────────────
  if (phase === 'processing') {
    const steps = [t('pay.step.verify'), t('pay.step.bank'), t('pay.step.confirm')];
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text variant="h3">{t('pay.processing')}</Text>
          <View style={{ gap: 12, alignSelf: 'stretch', paddingHorizontal: 40 }}>
            {steps.map((label, i) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: i <= step ? 1 : 0.35 }}>
                <Icon name={i < step ? 'check-circle' : 'clock'} size={18} color={i < step ? '#10B981' : colors.muted} />
                <Text variant="body">{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  // ── Success + receipt ───────────────────────────────────────────────────────
  if (phase === 'success' && receipt) {
    const rows: [string, string][] = [
      [t('pay.plan'), plan.name[locale]],
      [t('pay.amount'), formatMoney(receipt.amount)],
      [t('pay.method'), `${BRAND_LABEL[receipt.brand ?? 'unknown']} •••• ${receipt.last4}`.trim()],
      [t('pay.txn'), receipt.transactionId ?? ''],
      [t('pay.date'), date(receipt.activatedAt)],
      [t('pay.validUntil'), date(receipt.expiresAt)],
    ];
    return (
      <Screen scroll>
        <View style={{ alignItems: 'center', gap: 10, marginTop: 40, marginBottom: 24 }}>
          <Animated.View entering={ZoomIn.springify()} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#10B98122', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check-circle" size={48} color="#10B981" />
          </Animated.View>
          <Text variant="h2">{t('pay.successTitle')}</Text>
          <Text variant="body" tone="muted">
            {t('pay.successBody')}
          </Text>
        </View>
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card style={{ gap: 12 }}>
            <Text variant="overline" tone="muted">
              {t('pay.receipt')}
            </Text>
            {rows.map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text variant="caption" tone="muted">
                  {k}
                </Text>
                <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold', flexShrink: 1 }}>
                  {v}
                </Text>
              </View>
            ))}
          </Card>
        </Animated.View>
        <View style={{ marginTop: 24 }}>
          <Button label={t('pay.done')} iconRight="check" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  // ── Failed ──────────────────────────────────────────────────────────────────
  if (phase === 'failed') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 12 }}>
          <Animated.View entering={ZoomIn.springify()} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#EF444422', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x-circle" size={48} color="#EF4444" />
          </Animated.View>
          <Text variant="h2">{t('pay.failTitle')}</Text>
          <Text variant="body" tone="muted" center>
            {t(`pay.fail.${failure ?? 'declined'}` as any)}
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
            <Button label={t('pay.tryAgain')} iconLeft="credit-card" onPress={() => setPhase('form')} />
          </View>
        </View>
      </Screen>
    );
  }

  // ── Card form ───────────────────────────────────────────────────────────────
  // Typed digits, with the rest shown as • — always four groups of four.
  const shownNumber = digitsOnly(card.number).padEnd(16, '•').replace(/(.{4})(?=.)/g, '$1 ');
  const tests: [string, string][] = [
    [TEST_CARDS.success, t('pay.test.success')],
    [TEST_CARDS.declined, t('pay.test.declined')],
    [TEST_CARDS.insufficientFunds, t('pay.test.insufficient')],
  ];

  return (
    <Screen scroll>
      <Header showBack title={t('pay.title')} />

      {/* Always clear that this is a simulation. */}
      <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#F59E0B14', borderColor: '#F59E0B55' }}>
        <Icon name="info" size={20} color="#F59E0B" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyMedium">{t('pay.demoTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t('pay.demoBody')}
          </Text>
        </View>
      </Card>

      {/* Order summary */}
      <Card style={{ gap: 10, marginTop: 14 }}>
        <Text variant="overline" tone="muted">
          {t('pay.summary')}
        </Text>
        <Row label={t('pay.plan')} value={plan.name[locale]} />
        <Row label={t('pay.period')} value={plan.name[locale]} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="bodyMedium">{t('pay.total')}</Text>
            <Text variant="caption" tone="muted">
              {t('pay.vatIncluded')}
            </Text>
          </View>
          <Text variant="h2">{formatMoney(plan.price)}</Text>
        </View>
      </Card>

      {/* Live card preview */}
      <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: 20 }}>
        <LinearGradient colors={[gradient[0], gradient[gradient.length - 1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 20, height: 190, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Icon name="credit-card" size={28} color="#FFF" />
            <Text variant="h3" tone="inverse" style={{ fontFamily: 'Inter_700Bold' }}>
              {BRAND_LABEL[brand]}
            </Text>
          </View>
          <Text variant="h2" tone="inverse" style={{ letterSpacing: 2, writingDirection: 'ltr', textAlign: 'center' }}>
            {shownNumber}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="inverse" numberOfLines={1} style={{ flex: 1 }}>
              {card.holder.trim().toUpperCase() || t('pay.holder')}
            </Text>
            <Text variant="caption" tone="inverse" style={{ writingDirection: 'ltr' }}>
              {card.expiry || 'MM/YY'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Test cards */}
      <Text variant="caption" tone="muted" style={{ marginTop: 18, marginBottom: 8 }}>
        {t('pay.testCards')}
      </Text>
      <View style={{ gap: 8 }}>
        {tests.map(([num, label]) => (
          <Pressable
            key={num}
            onPress={() => setCard({ number: num, holder: user.fullName, expiry: '12/30', cvv: '123' })}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
          >
            <Text variant="caption" style={{ fontFamily: 'Inter_500Medium', writingDirection: 'ltr' }}>
              {num}
            </Text>
            <Text variant="caption" tone="muted">
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Card fields */}
      <Text variant="h3" style={{ marginTop: 22, marginBottom: 12 }}>
        {t('pay.card')}
      </Text>
      <View style={{ gap: 14 }}>
        <Input
          label={t('pay.number')}
          iconLeft="credit-card"
          value={card.number}
          onChangeText={(v) => set('number')(formatCardNumber(v))}
          keyboardType="number-pad"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          error={showErrors && errors.number ? t('pay.err.number') : undefined}
          style={{ writingDirection: 'ltr' }}
        />
        <Input
          label={t('pay.holder')}
          iconLeft="user"
          value={card.holder}
          onChangeText={set('holder')}
          autoCapitalize="characters"
          error={showErrors && errors.holder ? t('pay.err.holder') : undefined}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input
              label={t('pay.expiry')}
              iconLeft="calendar"
              value={card.expiry}
              onChangeText={(v) => set('expiry')(formatExpiry(v))}
              keyboardType="number-pad"
              placeholder="MM/YY"
              maxLength={5}
              error={showErrors && errors.expiry ? t('pay.err.expiry') : undefined}
              style={{ writingDirection: 'ltr' }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label={t('pay.cvv')}
              iconLeft="lock"
              value={card.cvv}
              onChangeText={(v) => set('cvv')(digitsOnly(v).slice(0, 3))}
              keyboardType="number-pad"
              placeholder="123"
              maxLength={3}
              secure
              error={showErrors && errors.cvv ? t('pay.err.cvv') : undefined}
            />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Button label={`${t('pay.payNow')} ${formatMoney(plan.price)}`} iconLeft="lock" onPress={pay} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <Icon name="shield" size={14} color={colors.muted} />
          <Text variant="caption" tone="muted">
            {t('pay.secure')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
        {value}
      </Text>
    </View>
  );
}
