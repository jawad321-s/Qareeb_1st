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
import { CATEGORIES } from '@/constants/categories';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useLocaleStore } from '@/i18n';
import { radius } from '@/theme/tokens';
import type { UserRole } from '@/types';

export default function Register() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: UserRole = roleParam === 'artisan' ? 'artisan' : 'customer';
  const isArtisan = role === 'artisan';

  const [loading, setLoading] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [catError, setCatError] = useState<string | undefined>();
  const { t } = useT();
  const { colors } = useTheme();
  const locale = useLocaleStore((s) => s.locale);

  const schema = useMemo(() => (isArtisan ? artisanRegisterSchema : registerSchema), [isArtisan]);
  const { control, handleSubmit, getValues, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      ...(isArtisan ? { experience: '', serviceRadius: '', bio: '' } : {}),
    },
  });

  const toggleCategory = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setCatError(undefined);
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const onSubmit = async () => {
    if (isArtisan && categoryIds.length === 0) {
      setCatError(t('auth.errCategories'));
      return;
    }
    setLoading(true);
    // Simulate account creation, then move to OTP verification.
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    router.push({ pathname: '/(auth)/otp', params: { phone: getValues('phone'), role } });
  };

  const baseFields = [
    { name: 'fullName' as const, label: t('auth.fullName'), placeholder: 'Layla Al-Harbi', icon: 'user' as const, kb: 'default' as const },
    { name: 'email' as const, label: t('auth.email'), placeholder: 'you@example.com', icon: 'mail' as const, kb: 'email-address' as const },
    { name: 'phone' as const, label: t('auth.phone'), placeholder: '+970 5X XXX XXXX', icon: 'phone' as const, kb: 'phone-pad' as const },
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
                  placeholder={f.placeholder}
                  iconLeft={f.icon}
                  keyboardType={f.kb}
                  autoCapitalize={f.name === 'email' ? 'none' : 'words'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors[f.name]?.message as string | undefined}
                />
              )}
            />
          ))}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label={t('auth.password')} placeholder="••••••••" iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message as string | undefined} />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label={t('auth.confirmPassword')} placeholder="••••••••" iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message as string | undefined} />
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

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="experience"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <Input label={t('auth.experience')} placeholder="8" iconLeft="award" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.experience?.message as string | undefined} />
                    )}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="serviceRadius"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <Input label={t('auth.serviceRadius')} placeholder="15 km" iconLeft="map-pin" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.serviceRadius?.message as string | undefined} />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input label={t('auth.bio')} placeholder={t('auth.bioPlaceholder')} multiline value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bio?.message as string | undefined} />
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
