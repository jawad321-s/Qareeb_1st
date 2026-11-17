import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/feedback/Toast';
import { config } from '@/lib/config';
import { confirmAction } from '@/lib/confirm';
import { markAccountLeaving } from '@/hooks/useAccountGuard';
import { AccountError, deleteMyAccount } from '@/services/auth.service';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme/tokens';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';

const GONE: TranslationKey[] = ['del.gone.login', 'del.gone.profile', 'del.gone.requests', 'del.gone.photos'];

/**
 * Delete my account, for good. Says what goes, asks for the password and a
 * last confirmation, then the server removes the account and the app signs out.
 * Not possible while a job is in progress.
 */
export default function DeleteAccount() {
  const toast = useToast();
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password) {
      setError(t('cp.errCurrent'));
      return;
    }
    const ok = await confirmAction({
      title: t('del.confirmTitle'),
      message: t('del.confirmBody'),
      confirmLabel: t('del.confirm'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok || !user) return;
    setLoading(true);
    setError(undefined);
    markAccountLeaving(user.uid);
    try {
      if (!config.useMock) await deleteMyAccount(password);
      signOut();
      toast('success', t('del.done'));
      router.replace('/(auth)/welcome');
    } catch (err) {
      markAccountLeaving(null);
      const key = err instanceof AccountError ? err.key : 'auth.errGeneric';
      if (key === 'cp.errWrong') setError(t(key));
      else toast('error', t(key) + (err instanceof AccountError && err.detail ? ` (${err.detail})` : ''));
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Header showBack title={t('del.title')} />
      <View style={{ gap: 16 }}>
        <Card style={{ gap: 12, borderColor: palette.danger + '55', backgroundColor: palette.danger + '0D' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="alert-circle" size={20} color={palette.danger} />
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {t('del.warning')}
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            {GONE.map((key) => (
              <View key={key} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <View style={{ marginTop: 2 }}>
                  <Icon name="x" size={15} color={palette.danger} />
                </View>
                <Text variant="caption" style={{ flex: 1 }}>
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="caption" tone="muted">
            {t('del.activeJobs')}
          </Text>
        </Card>
        <Input
          label={t('del.password')}
          iconLeft="lock"
          secure
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(undefined);
          }}
          error={error}
        />
        <Button label={t('del.submit')} variant="danger" iconLeft="trash" onPress={submit} loading={loading} />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} disabled={loading} />
      </View>
    </Screen>
  );
}
