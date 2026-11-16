import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/feedback/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import {
  SUGGESTION_DETAILS_MAX,
  SUGGESTION_NAME_MAX,
  SUGGESTION_NAME_MIN,
  submitSuggestion,
} from '@/services/suggestions.service';

/**
 * Suggest a service the app doesn't offer yet. Reached from the service lists
 * (new request, add a service) and from the profile; the suggestion goes to
 * the admin dashboard → Suggestions.
 */
export default function Suggest() {
  const { colors } = useTheme();
  const { t } = useT();
  const toast = useToast();
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const nameOk = name.trim().length >= SUGGESTION_NAME_MIN;

  const submit = async () => {
    if (!nameOk) return;
    setLoading(true);
    try {
      await submitSuggestion({ name, details });
      toast('success', t('suggest.sent'));
      router.back();
    } catch {
      toast('error', t('suggest.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Header showBack title={t('suggest.title')} />
      <View style={{ alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tint + '18' }}>
          <Icon name="lightbulb" size={30} color={colors.tint} />
        </View>
        <Text variant="body" tone="muted" center>
          {t('suggest.subtitle')}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <Input
          label={t('suggest.name')}
          placeholder={t('suggest.namePlaceholder')}
          value={name}
          onChangeText={setName}
          maxLength={SUGGESTION_NAME_MAX}
          returnKeyType="next"
        />
        <Input
          label={t('suggest.details')}
          placeholder={t('suggest.detailsPlaceholder')}
          value={details}
          onChangeText={setDetails}
          maxLength={SUGGESTION_DETAILS_MAX}
          multiline
        />
        <Button label={t('suggest.submit')} iconLeft="send" onPress={submit} loading={loading} disabled={!nameOk} style={{ marginTop: 8 }} />
      </View>
    </Screen>
  );
}

