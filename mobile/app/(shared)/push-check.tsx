import { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { isTokenSaved, lastPushRegistration, registerForPush, sendTestPush, type PushRegistration } from '@/lib/push';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';

type State = 'ok' | 'bad' | 'unknown';

/**
 * "Not getting notifications on the phone?": checks each link of the chain —
 * permission, this phone's push token, the token saved on the account — and
 * sends a test notification through Expo, as the server does.
 */
export default function PushCheck() {
  const { t } = useT();
  const uid = useAuth((s) => s.user?.uid ?? '');
  const [permission, setPermission] = useState<string>('…');
  // iPhone: how iOS is allowed to show Expo Go's notifications (Settings → Notifications → Expo Go).
  const [ios, setIos] = useState<Notifications.NotificationPermissionsStatus['ios'] | undefined>();
  const [reg, setReg] = useState<PushRegistration | undefined>(() => lastPushRegistration());
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<'register' | 'test' | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async (r = lastPushRegistration()) => {
    setReg(r);
    const perms = await Notifications.getPermissionsAsync();
    setPermission(perms.status);
    setIos(perms.ios);
    setSaved(r?.ok && uid ? await isTokenSaved(uid, r.token).catch(() => false) : null);
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = async () => {
    setBusy('register');
    setResult(null);
    const r = await registerForPush(uid);
    await refresh({ ...r, at: Date.now() });
    setBusy(null);
  };

  // A notification from the phone itself in 5 s: shows whether iOS displays
  // notifications on the home screen at all, whatever the server does.
  const localTest = async () => {
    await Notifications.scheduleNotificationAsync({
      content: { title: t('push.testTitle'), body: t('push.localBody'), sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
    });
    setResult({ ok: true, text: t('push.localSent') });
  };

  const test = async () => {
    if (!reg?.ok) return;
    setBusy('test');
    try {
      const r = await sendTestPush(reg.token, t('push.testTitle'), t('push.testBody'));
      setResult(r.ok ? { ok: true, text: t('push.sent') } : { ok: false, text: `${t('push.sendFailed')} ${r.error}${r.error === 'DeviceNotRegistered' ? ` — ${t('push.reRegister')}` : ''}` });
    } catch (err) {
      setResult({ ok: false, text: `${t('push.sendFailed')} ${(err as Error)?.message ?? ''}` });
    } finally {
      setBusy(null);
    }
  };

  const regText = !reg ? t('push.notYet') : reg.ok ? t('push.registered') : reg.reason === 'error' ? `${t('push.reason.error')} ${reg.message ?? ''}` : t(`push.reason.${reg.reason}` as TranslationKey);

  return (
    <Screen scroll>
      <Header showBack title={t('push.title')} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 16 }}>
        {t('push.desc')}
      </Text>

      <Card style={{ gap: 14 }}>
        <Row state={permission === 'granted' ? 'ok' : permission === '…' ? 'unknown' : 'bad'} label={t('push.permission')} value={permission === 'granted' ? t('push.allowed') : permission === '…' ? '…' : t('push.denied')} />
        <Row state={!reg ? 'unknown' : reg.ok ? 'ok' : 'bad'} label={t('push.device')} value={regText} />
        <Row state={saved === null ? 'unknown' : saved ? 'ok' : 'bad'} label={t('push.account')} value={saved === null ? '—' : saved ? t('push.savedYes') : t('push.savedNo')} />
        {Platform.OS === 'ios' && ios && (
          <>
            <Row
              state={ios.alertStyle !== Notifications.IosAlertStyle.NONE && ios.allowsAlert !== false ? 'ok' : 'bad'}
              label={t('push.banners')}
              value={ios.alertStyle !== Notifications.IosAlertStyle.NONE && ios.allowsAlert !== false ? t('push.on') : t('push.bannersOff')}
            />
            <Row state={ios.allowsDisplayOnLockScreen === false ? 'bad' : 'ok'} label={t('push.lockScreen')} value={ios.allowsDisplayOnLockScreen === false ? t('push.lockOff') : t('push.on')} />
          </>
        )}
      </Card>

      <View style={{ gap: 12, marginTop: 20 }}>
        <Button label={t('push.register')} variant="outline" loading={busy === 'register'} onPress={register} />
        <Button label={t('push.test')} loading={busy === 'test'} disabled={!reg?.ok} onPress={test} />
        {Platform.OS !== 'web' && <Button label={t('push.localTest')} variant="secondary" disabled={permission !== 'granted'} onPress={localTest} />}
      </View>

      {result && (
        <Card style={{ marginTop: 16, borderColor: result.ok ? '#10B981' : '#EF4444' }}>
          <Text variant="body" style={{ color: result.ok ? '#10B981' : '#EF4444' }}>
            {result.text}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

function Row({ state, label, value }: { state: State; label: string; value: string }) {
  const { colors } = useTheme();
  const color = state === 'ok' ? '#10B981' : state === 'bad' ? '#EF4444' : colors.muted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <Icon name={state === 'ok' ? 'check-circle' : state === 'bad' ? 'x-circle' : 'help-circle'} size={20} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyMedium">{label}</Text>
        <Text variant="caption" tone="muted">
          {value}
        </Text>
      </View>
    </View>
  );
}
