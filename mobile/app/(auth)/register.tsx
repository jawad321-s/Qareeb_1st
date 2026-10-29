import React, { useMemo, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { registerSchema, artisanRegisterSchema } from '@/lib/validation';
import { api } from '@/services/api';
import { useVerification } from '@/store/verification';
import { useAuth } from '@/store/auth';
import { authErrorMessage } from '@/services/auth.service';
import { config } from '@/lib/config';
import { CATEGORIES } from '@/constants/categories';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useLocaleStore } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';
import { radius } from '@/theme/tokens';
import type { UserRole } from '@/types';

export default function Register() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: UserRole = roleParam === 'artisan' ? 'artisan' : 'customer';
  const isArtisan = role === 'artisan';

  const [loading, setLoading] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [catError, setCatError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const { t } = useT();
  const { colors } = useTheme();
  const locale = useLocaleStore((s) => s.locale);

  const schema = useMemo(() => (isArtisan ? artisanRegisterSchema : registerSchema), [isArtisan]);
  const { control, handleSubmit, getValues, setError, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      password: '',
      confirmPassword: '',
      ...(isArtisan ? { experience: '', bio: '' } : {}),
    },
  });

  const toggleCategory = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setCatError(undefined);
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const setArtisanDraft = useVerification((s) => s.setArtisanDraft);
  const register = useAuth((s) => s.register);

  const onSubmit = async () => {
    if (isArtisan && categoryIds.length === 0) {
      setCatError(t('auth.errCategories'));
      return;
    }
    setLoading(true);
    setFormError(undefined);
    // A number holds one account of each type: a customer and an artisan
    // account are separate, but the same type can't be registered twice.
    const taken = await api.isPhoneRegistered(getValues('phone'), role).catch(() => false);
    if (taken) {
      setLoading(false);
      setError('phone', { message: t(isArtisan ? 'auth.errPhoneTakenArtisan' : 'auth.errPhoneTakenCustomer') });
      return;
    }
    const artisan = isArtisan
      ? {
          categoryIds,
          experienceYears: Number(getValues('experience')) || undefined,
          bio: (getValues('bio') as string) || undefined,
        }
      : undefined;
    // Persist the professional profile so verification (and Firestore) get it.
    if (artisan) setArtisanDraft(artisan);

    if (!config.useMock) {
      // Live: create the Firebase account + profile, then enter the app.
      try {
        await register({
          role: isArtisan ? 'artisan' : 'customer',
          fullName: getValues('fullName'),
          phone: getValues('phone'),
          password: getValues('password'),
          locale,
          artisan,
        });
      } catch (err) {
        setFormError(authErrorMessage(err, t));
        setLoading(false);
        return;
      }
      setLoading(false);
      router.replace('/');
      // New artisans continue to document verification as the next step.
      if (isArtisan) setTimeout(() => router.push('/(shared)/verification'), 350);
      return;
    }

    // Demo: the account is created once the phone number is verified (OTP step).
    setLoading(false);
    router.push({ pathname: '/(auth)/otp', params: { phone: getValues('phone'), role, fullName: getValues('fullName') } });
  };

  const baseFields = [
    { name: 'fullName' as const, label: t('auth.fullName'), icon: 'user' as const, kb: 'default' as const },
    { name: 'phone' as const, label: t('auth.phone'), icon: 'phone' as const, kb: 'phone-pad' as const },
  ];

  return (
    <Screen scroll>
      <Header showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 6, marginBottom: 24 }}>
          <Text variant="h1">{isArtisan ? t('auth.registerArtisanTitle') : t('auth.registerCustomerTitle')}</Text>
          <Text variant="body" tone="muted">
            {isArtisan ? t('auth.registerArtisanSubtitle') : t('auth.registerSubtitle')}
          </Text>
        </Animated.View>

        <View style={{ gap: 16 }}>
          {baseFields.map((f) => (
            <Controller
              key={f.name}
              control={control}
              name={f.name}
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label={f.label}
                  iconLeft={f.icon}
                  keyboardType={f.kb}
                  autoCapitalize={f.name === 'phone' ? 'none' : 'words'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors[f.name]?.message ? t(errors[f.name]?.message as TranslationKey) : undefined}
                />
              )}
            />
          ))}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label={t('auth.password')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message as string | undefined} />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label={t('auth.confirmPassword')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message as string | undefined} />
            )}
          />

          {isArtisan && (
            <Animated.View entering={FadeInDown.duration(500)} style={{ gap: 16, marginTop: 8 }}>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
              <View style={{ gap: 3 }}>
                <Text variant="bodyMedium">{t('auth.proInfo')}</Text>
                <Text variant="caption" tone="muted">
                  {t('auth.proInfoDesc')}
                </Text>
              </View>

              {/* Category multi-select */}
              <View style={{ gap: 8 }}>
                <Text variant="caption" tone="muted" style={{ marginLeft: 4 }}>
                  {t('auth.selectCategories')} · {t('auth.selectCategoriesHint')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map((c) => {
                    const active = categoryIds.includes(c.id);
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => toggleCategory(c.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          borderRadius: radius.full,
                          borderWidth: 1.5,
                          borderColor: active ? c.colorHex : colors.border,
                          backgroundColor: active ? c.colorHex + '18' : colors.surface,
                        }}
                      >
                        <Icon name={c.icon as any} size={15} color={active ? c.colorHex : colors.muted} />
                        <Text variant="caption" style={{ color: active ? c.colorHex : colors.fg }}>
                          {c.name[locale]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {catError && (
                  <Text variant="caption" tone="danger" style={{ marginLeft: 4 }}>
                    {catError}
                  </Text>
                )}
              </View>

              <Controller
                control={control}
                name="experience"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input label={t('auth.experience')} iconLeft="award" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.experience?.message as string | undefined} />
                )}
              />

              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input label={t('auth.bio')} multiline value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bio?.message as string | undefined} />
                )}
              />

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.surface2, padding: 12, borderRadius: radius.md }}>
                <Icon name="shield" size={16} color={colors.tint} />
                <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                  {t('auth.verifyNote')}
                </Text>
              </View>
            </Animated.View>
          )}

          {formError && (
            <Text variant="caption" tone="danger" center>
              {formError}
            </Text>
          )}

          <Button label={t('common.continue')} onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 4 }} />

          <Text variant="caption" tone="muted" center style={{ marginTop: 4 }}>
            {t('auth.terms')}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <Text variant="body" tone="muted">
              {t('auth.haveAccount')}
            </Text>
            <Text variant="body" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }} onPress={() => router.replace({ pathname: '/(auth)/login', params: { role } })}>
              {t('auth.signIn')}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
