import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/store/auth';
import { useT } from '@/i18n';

const LENGTH = 4;

export default function Otp() {
  const { colors } = useTheme();
  const { phone, role } = useLocalSearchParams<{ phone?: string; role?: string }>();
  const signInAs = useAuth((s) => s.signInAs);
  const { t } = useT();
  const [code, setCode] = useState<string[]>(Array(LENGTH).fill(''));
  const [seconds, setSeconds] = useState(45);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const setDigit = (i: number, v: string) => {
    const digit = v.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const filled = code.every((c) => c !== '');

  const verify = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    // Mock: any code verifies and signs the user into the matching app.
    const isArtisan = role === 'artisan';
    signInAs(isArtisan ? 'artisan' : 'customer');
    router.replace('/');
    // New artisans continue to document verification as the next step.
    if (isArtisan) setTimeout(() => router.push('/(shared)/verification'), 350);
  };

  return (
    <Screen>
      <Header showBack />
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 8, marginBottom: 32 }}>
        <Text variant="h1">{t('otp.title')}</Text>
        <Text variant="body" tone="muted">
          {t('otp.sentTo')} {phone ?? t('otp.yourPhone')}
        </Text>
      </Animated.View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              inputs.current[i] = r;
            }}
            value={digit}
            onChangeText={(v) => setDigit(i, v)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !digit && i > 0) inputs.current[i - 1]?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
            style={{
              width: 60,
              height: 68,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: digit ? colors.tint : colors.border,
              backgroundColor: colors.surface,
              textAlign: 'center',
              fontSize: 26,
              fontFamily: 'Inter_700Bold',
              color: colors.fg,
            }}
          />
        ))}
      </View>

      <Button label={t('otp.verify')} onPress={verify} loading={loading} disabled={!filled} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 20 }}>
        {seconds > 0 ? (
          <Text variant="body" tone="muted">
            {t('otp.resendIn')} {seconds}s
          </Text>
        ) : (
          <Pressable onPress={() => setSeconds(45)}>
            <Text variant="body" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {t('otp.resend')}
            </Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
