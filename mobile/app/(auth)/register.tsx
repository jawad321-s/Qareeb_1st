import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { registerSchema, type RegisterInput } from '@/lib/validation';
import { useT } from '@/i18n';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const { t } = useT();
  const { control, handleSubmit, getValues, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (_data: RegisterInput) => {
    setLoading(true);
    // Simulate account creation, then move to OTP verification.
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    router.push({ pathname: '/(auth)/otp', params: { phone: getValues('phone') } });
  };

  const fields = [
    { name: 'fullName' as const, label: t('auth.fullName'), placeholder: 'Layla Al-Harbi', icon: 'user' as const, kb: 'default' as const },
    { name: 'email' as const, label: t('auth.email'), placeholder: 'you@example.com', icon: 'mail' as const, kb: 'email-address' as const },
    { name: 'phone' as const, label: t('auth.phone'), placeholder: '+970 5X XXX XXXX', icon: 'phone' as const, kb: 'phone-pad' as const },
  ];

  return (
    <Screen scroll>
      <Header showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 6, marginBottom: 24 }}>
          <Text variant="h1">{t('auth.registerTitle')}</Text>
          <Text variant="body" tone="muted">
            {t('auth.registerSubtitle')}
          </Text>
        </Animated.View>

        <View style={{ gap: 16 }}>
          {fields.map((f) => (
            <Controller
              key={f.name}
              control={control}
              name={f.name}
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label={f.label}
                  placeholder={f.placeholder}
                  iconLeft={f.icon}
                  keyboardType={f.kb}
                  autoCapitalize={f.name === 'email' ? 'none' : 'words'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors[f.name]?.message}
                />
              )}
            />
          ))}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label={t('auth.password')} placeholder="••••••••" iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label={t('auth.confirmPassword')} placeholder="••••••••" iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} />
            )}
          />

          <Button label={t('common.continue')} onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 4 }} />

          <Text variant="caption" tone="muted" center style={{ marginTop: 4 }}>
            {t('auth.terms')}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text variant="body" tone="muted">
              {t('auth.haveAccount')}
            </Text>
            <Text variant="body" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }} onPress={() => router.replace('/(auth)/login')}>
              {t('auth.signIn')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
