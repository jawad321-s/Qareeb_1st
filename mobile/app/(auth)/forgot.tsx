import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { roleAccents } from '@/theme/tokens';

// Sign-in is by phone number, so the reset goes to the phone too.
const schema = z.object({ phone: z.string().min(9, 'Enter a valid phone number') });
type Form = z.infer<typeof schema>;

export default function Forgot() {
  // Keep the account type so "back to sign in" returns to the same login.
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = roleParam === 'artisan' ? 'artisan' : 'customer';
  const { isDark } = useTheme();
  const accent = roleAccents[role];
  const tint = isDark ? accent.tintDark : accent.tintLight;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useT();
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSent(true);
  };

  return (
    <Screen scroll>
      <Header showBack />
      {sent ? (
        <View style={{ marginTop: 40 }}>
          <EmptyState
            icon="message"
            title={t('forgot.sentTitle')}
            description={t('forgot.sentDesc')}
            actionLabel={t('forgot.backToSignIn')}
            onAction={() => router.replace({ pathname: '/(auth)/login', params: { role } })}
          />
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 8, marginBottom: 28 }}>
            <Text variant="h1">{t('forgot.title')}</Text>
            <Text variant="body" tone="muted">
              {t('forgot.subtitle')}
            </Text>
          </Animated.View>
          <View style={{ gap: 16 }}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label={t('auth.phone')}
                  placeholder="+970 5X XXX XXXX"
                  iconLeft="phone"
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                />
              )}
            />
            <Button label={t('forgot.send')} onPress={handleSubmit(onSubmit)} loading={loading} accent={{ gradient: accent.gradient, tint }} />
          </View>
        </>
      )}
    </Screen>
  );
}
