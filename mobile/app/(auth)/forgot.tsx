import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
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

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Form = z.infer<typeof schema>;

export default function Forgot() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
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
            icon="mail"
            title="Check your inbox"
            description="We've sent a password reset link to your email address."
            actionLabel="Back to sign in"
            onAction={() => router.replace('/(auth)/login')}
          />
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 8, marginBottom: 28 }}>
            <Text variant="h1">Reset password</Text>
            <Text variant="body" tone="muted">
              Enter your email and we'll send you a reset link.
            </Text>
          </Animated.View>
          <View style={{ gap: 16 }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Email"
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
            <Button label="Send reset link" onPress={handleSubmit(onSubmit)} loading={loading} />
          </View>
        </>
      )}
    </Screen>
  );
}
