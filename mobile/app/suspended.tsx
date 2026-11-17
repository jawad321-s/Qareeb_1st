import React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { useSupportUnread } from '@/components/domain/SupportButton';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme/tokens';
import { useT } from '@/i18n';

/**
 * Where a suspended account lands (after signing in, or the moment the team
 * suspends it). Nothing else in the app is open to it: only the chat with the
 * Qareeb team, to ask why or object, and signing out.
 */
export default function Suspended() {
  const { t } = useT();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const unread = useSupportUnread();

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.status !== 'suspended') return <Redirect href="/" />;

  return (
    <Screen scroll>
      <View style={{ flex: 1, justifyContent: 'center', gap: 20, paddingVertical: 40 }}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.danger + '1A' }}>
            <Icon name="lock" size={34} color={palette.danger} />
          </View>
          <Text variant="h2" style={{ textAlign: 'center' }}>
            {t('suspended.title')}
          </Text>
          <Text variant="body" tone="muted" style={{ textAlign: 'center', lineHeight: 22 }}>
            {t('suspended.body')}
          </Text>
        </View>
        {!!user.suspendReason && (
          <Card style={{ gap: 4 }}>
            <Text variant="caption" tone="muted">
              {t('suspended.reason')}
            </Text>
            <Text variant="body">{user.suspendReason}</Text>
          </Card>
        )}
        <View style={{ gap: 10 }}>
          <Button
            label={unread ? t('suspended.chatUnread') : t('suspended.chat')}
            iconLeft="message"
            onPress={() => router.push('/(shared)/support')}
          />
          <Button label={t('profile.signOut')} variant="ghost" iconLeft="log-out" onPress={signOut} />
        </View>
      </View>
    </Screen>
  );
}
