import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { useAuth } from '@/store/auth';
import { AuthError } from '@/services/auth.service';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';
import { roleAccents } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { UserRole } from '@/types';

export default function Login() {
  const signIn = useAuth((s) => s.signIn);
  const { t } = useT();
  const { isDark } = useTheme();
  // Each account type has its own sign-in entry, reached from the role picker.
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: UserRole = roleParam === 'artisan' ? 'artisan' : 'customer';
  const accent = roleAccents[role];
  const tint = isDark ? accent.tintDark : accent.tintLight;

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setFormError(undefined);
    try {
      await signIn(data.phone, data.password, role);
      router.replace('/');
    } catch (err) {
      setFormError(t(err instanceof AuthError ? err.key : 'auth.errGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Header showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 10, marginBottom: 24 }}>
          {/* Which account type this sign-in belongs to */}
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: tint + '16',
              borderWidth: 1,
              borderColor: tint + '40',
            }}
          >
            <Icon name={role === 'artisan' ? 'tools' : 'search'} size={15} color={tint} />
            <Text variant="caption" style={{ color: tint, fontFamily: 'Inter_600SemiBold' }}>
              {t(role === 'artisan' ? 'role.artisan.title' : 'role.customer.title')}
            </Text>
          </View>

          <Text variant="h1">{t('auth.welcomeBack')}</Text>
          <Text variant="body" tone="muted">
            {t('auth.signInSubtitle')}
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
                error={errors.phone?.message && t(errors.phone.message as TranslationKey)}
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
            style={{ color: tint, fontFamily: 'Inter_500Medium' }}
            onPress={() => router.push('/(auth)/forgot')}
          >
            {t('auth.forgot')}
          </Text>

          {formError && (
            <Text variant="caption" tone="danger" center>
              {formError}
            </Text>
          )}

          <Button
            label={t('auth.signIn')}
            accent={{ gradient: accent.gradient, tint }}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 }}>
            <Text variant="body" tone="muted">
              {t('auth.newHere')}
            </Text>
            <Text
              variant="body"
              style={{ color: tint, fontFamily: 'Inter_600SemiBold' }}
              onPress={() => router.push({ pathname: '/(auth)/register', params: { role } })}
            >
              {t('auth.createAccount')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
