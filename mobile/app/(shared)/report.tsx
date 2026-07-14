import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/feedback/Toast';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

export default function Report() {
  const { colors } = useTheme();
  const toast = useToast();
  const { t } = useT();
  const REASONS = [t('report.r1'), t('report.r2'), t('report.r3'), t('report.r4'), t('report.r5'), t('report.r6')];
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast('success', 'Report submitted — our team will review it');
    router.back();
  };

  return (
    <Screen scroll>
      <Header showBack title={t('report.title')} />
      <Text variant="body" tone="muted" style={{ marginBottom: 20 }}>
        {t('report.subtitle')}
      </Text>

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t('report.reason')}
      </Text>
      <View style={{ gap: 10, marginBottom: 20 }}>
        {REASONS.map((r) => {
          const active = reason === r;
          return (
            <Pressable key={r} onPress={() => setReason(r)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: active ? colors.tint : colors.border, backgroundColor: active ? colors.tint + '12' : colors.surface }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? colors.tint : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.tint }} />}
              </View>
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {r}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t('report.details')}
      </Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder={t('report.detailsPlaceholder')}
        placeholderTextColor={colors.muted}
        multiline
        style={{ minHeight: 120, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, color: colors.fg, fontSize: 15, fontFamily: 'Inter_400Regular', textAlignVertical: 'top', marginBottom: 20 }}
      />

      <Button label={t('report.submit')} iconLeft="flag" variant="danger" onPress={submit} loading={loading} disabled={!reason} />
    </Screen>
  );
}
