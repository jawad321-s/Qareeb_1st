import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/feedback/Toast';
import { config } from '@/lib/config';
import { AccountError, changePassword } from '@/services/auth.service';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';

// Messages are translation keys; the screen passes them through t().
const schema = z
  .object({
    current: z.string().min(1, 'cp.errCurrent'),
    next: z.string().min(6, 'reset.err.short'),
    confirm: z.string().min(1, 'auth.errConfirm'),
  })
  .refine((d) => d.next === d.confirm, { message: 'reset.err.match', path: ['confirm'] })
  .refine((d) => d.next !== d.current, { message: 'cp.errSame', path: ['next'] });
type Form = z.infer<typeof schema>;

/**
 * Change the password: the current one is checked first, then the new one is
 * set on the account, so the next sign-in (on any phone) uses it.
 */
export default function ChangePassword() {
  const toast = useToast();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { current: '', next: '', confirm: '' },
  });
  const msg = (key?: string) => (key ? t(key as TranslationKey) : undefined);

  const onSubmit = async ({ current, next }: Form) => {
    setLoading(true);
    try {
      if (!config.useMock) await changePassword(current, next);
      toast('success', t('cp.done'));
      router.back();
    } catch (err) {
      const key = err instanceof AccountError ? err.key : 'auth.errGeneric';
      // A wrong current password belongs under that field; anything else is a toast.
      if (key === 'cp.errWrong') setError('current', { message: key });
      else if (key === 'cp.errWeak') setError('next', { message: key });
      else toast('error', t(key) + (err instanceof AccountError && err.detail ? ` (${err.detail})` : ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Header showBack title={t('cp.title')} />
      <Text variant="body" tone="muted" style={{ marginBottom: 20 }}>
        {t('cp.subtitle')}
      </Text>
      <View style={{ gap: 16 }}>
        <Controller
          control={control}
          name="current"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input label={t('cp.current')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={msg(errors.current?.message)} />
          )}
        />
        <Controller
          control={control}
          name="next"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input label={t('cp.new')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={msg(errors.next?.message)} />
          )}
        />
        <Controller
          control={control}
          name="confirm"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input label={t('cp.confirm')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={msg(errors.confirm?.message)} />
          )}
        />
        <Button label={t('cp.update')} onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 8 }} />
      </View>
    </Screen>
  );
}
