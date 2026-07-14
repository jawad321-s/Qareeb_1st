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
import { useT } from '@/i18n';

const schema = z
  .object({
    current: z.string().min(6, 'Enter your current password'),
    next: z.string().min(6, 'At least 6 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type Form = z.infer<typeof schema>;

export default function ChangePassword() {
  const toast = useToast();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { current: '', next: '', confirm: '' },
  });

  const onSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast('success', 'Password updated');
    router.back();
  };

  return (
    <Screen scroll>
      <Header showBack title={t('cp.title')} />
      <Text variant="body" tone="muted" style={{ marginBottom: 20 }}>
        {t('cp.subtitle')}
      </Text>
      <View style={{ gap: 16 }}>
        <Controller control={control} name="current" render={({ field: { onChange, value, onBlur } }) => (
          <Input label={t('cp.current')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.current?.message} />
        )} />
        <Controller control={control} name="next" render={({ field: { onChange, value, onBlur } }) => (
          <Input label={t('cp.new')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.next?.message} />
        )} />
        <Controller control={control} name="confirm" render={({ field: { onChange, value, onBlur } }) => (
          <Input label={t('cp.confirm')} iconLeft="lock" secure value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirm?.message} />
        )} />
        <Button label={t('cp.update')} onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: 8 }} />
      </View>
    </Screen>
  );
}
