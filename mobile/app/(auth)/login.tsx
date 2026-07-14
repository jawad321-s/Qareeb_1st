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
import { loginSchema, type LoginInput } from '@/lib/validation';
import { useAuth } from '@/store/auth';
import { useT } from '@/i18n';

export default function Login() {
  const signIn = useAuth((s) => s.signIn);
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Header showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 6, marginBottom: 24 }}>
          <Text variant="h1">{t('auth.welcomeBack')}</Text>
          <Text variant="body" tone="muted">
            {t('auth.signInSubtitle')}
          </Text>
        </Animated.View>

        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label={t('auth.email')}
                placeholder="you@example.com"
                iconLeft="mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label={t('auth.password')}
                placeholder="••••••••"
                iconLeft="lock"
                secure
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />
          <Text
            variant="caption"
            tone="primary"
            style={{ textAlign: 'right', fontFamily: 'Inter_500Medium' }}
            onPress={() => router.push('/(auth)/forgot')}
          >
            {t('auth.forgot')}
          </Text>

          <Button label={t('auth.signIn')} onPress={handleSubmit(onSubmit)} loading={loading} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 }}>
            <Text variant="body" tone="muted">
              {t('auth.newHere')}
            </Text>
            <Text
              variant="body"
              tone="primary"
              style={{ fontFamily: 'Inter_600SemiBold' }}
              onPress={() => router.replace('/(auth)/register')}
            >
              {t('auth.createAccount')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
