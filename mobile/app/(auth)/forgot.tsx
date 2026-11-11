import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { displayPhone, isValidPhone } from '@/lib/phone';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { usePhoneVerifier } from '@/components/auth/PhoneVerifier';
import { confirmReset, resetErrorKey, sendResetCode } from '@/services/passwordReset.service';
import { useT } from '@/i18n';
import { config } from '@/lib/config';
import { useTheme } from '@/theme/ThemeProvider';
import { roleAccents } from '@/theme/tokens';

const RESEND_AFTER_S = 60;

/**
 * Forgot password: an SMS code proves the phone number, then the user picks a
 * new password (see services/passwordReset.service). The demo accepts any code.
 */
export default function Forgot() {
  // Keep the account type so "back to sign in" returns to the same login.
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = roleParam === 'artisan' ? 'artisan' : 'customer';
  const { isDark } = useTheme();
  const accent = roleAccents[role];
  const tint = isDark ? accent.tintDark : accent.tintLight;
  const { t } = useT();
  const { verifier, modal } = usePhoneVerifier();

  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ phone?: string; code?: string; password?: string; confirm?: string }>({});
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const send = async () => {
    if (!isValidPhone(phone)) {
      setFieldError({ phone: t('reset.err.phone') });
      return;
    }
    setFieldError({});
    setError(null);
    setLoading(true);
    try {
      setVerificationId(config.useMock ? 'demo' : await sendResetCode(phone, verifier));
      setStep('code');
      setSeconds(RESEND_AFTER_S);
    } catch (err) {
      // Closing the robot check is not an error worth showing.
      if ((err as Error)?.message !== 'recaptcha-cancelled') setError(t(resetErrorKey(err)));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    const errs: typeof fieldError = {};
    if (!/^\d{6}$/.test(code.trim())) errs.code = t('reset.err.codeFormat');
    if (password.length < 6) errs.password = t('reset.err.short');
    if (confirm !== password) errs.confirm = t('reset.err.match');
    setFieldError(errs);
    if (Object.keys(errs).length) return;
    setError(null);
    setLoading(true);
    try {
      if (!config.useMock) await confirmReset(verificationId, code.trim(), role, password);
      setStep('done');
    } catch (err) {
      setError(t(resetErrorKey(err)));
    } finally {
      setLoading(false);
    }
  };

  const backToSignIn = () => router.replace({ pathname: '/(auth)/login', params: { role } });

  return (
    <Screen scroll>
      <Header showBack />
      {modal}
      {step === 'done' ? (
        <View style={{ marginTop: 40 }}>
          <EmptyState icon="check-circle" title={t('reset.doneTitle')} description={t('reset.doneDesc')} actionLabel={t('forgot.backToSignIn')} onAction={backToSignIn} />
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 8, marginBottom: 28 }}>
            <Text variant="h1">{t('forgot.title')}</Text>
            <Text variant="body" tone="muted">
              {step === 'phone' ? t('reset.phoneDesc') : `${t('reset.codeDesc')} ${displayPhone(phone)}`}
            </Text>
          </Animated.View>

          {step === 'phone' ? (
            <View style={{ gap: 16 }}>
              <Input
                label={t('auth.phone')}
                placeholder="+970 5X XXX XXXX"
                iconLeft="phone"
                autoCapitalize="none"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                error={fieldError.phone}
              />
              <Button label={t('reset.send')} onPress={send} loading={loading} accent={{ gradient: accent.gradient, tint }} />
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Input
                label={t('reset.code')}
                placeholder="000000"
                iconLeft="lock"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                error={fieldError.code}
              />
              <Input label={t('reset.newPassword')} placeholder="••••••••" iconLeft="lock" secure value={password} onChangeText={setPassword} error={fieldError.password} />
              <Input label={t('reset.confirmPassword')} placeholder="••••••••" iconLeft="lock" secure value={confirm} onChangeText={setConfirm} error={fieldError.confirm} />
              <Button label={t('reset.submit')} onPress={reset} loading={loading} accent={{ gradient: accent.gradient, tint }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" tone="primary" onPress={() => setStep('phone')}>
                  {t('reset.changeNumber')}
                </Text>
                {seconds > 0 ? (
                  <Text variant="caption" tone="muted">
                    {t('otp.resendIn')} {seconds}s
                  </Text>
                ) : (
                  <Text variant="caption" tone="primary" onPress={loading ? undefined : send}>
                    {t('otp.resend')}
                  </Text>
                )}
              </View>
            </View>
          )}

          {!!error && (
            <Text variant="caption" style={{ color: '#EF4444', marginTop: 16, textAlign: 'center' }}>
              {error}
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
