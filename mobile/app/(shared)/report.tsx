import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/feedback/Toast';
import { useRequest, useUser } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { localizedTextAlign } from '@/i18n/rtl';
import { COMPLAINT_REASONS, DETAILS_MAX, complaintReasonKey, submitComplaint, type ComplaintKind } from '@/services/complaints.service';

/** "Other" needs a few words so the team knows what happened. */
const OTHER_MIN = 10;

/**
 * A complaint. With `targetId` it is about that person (an artisan or a
 * customer), and with `requestId` about the job they had together; without,
 * it is a general problem report (Profile → Report a problem).
 */
export default function Report() {
  const { colors } = useTheme();
  const toast = useToast();
  const { t, isRTL } = useT();
  const font = useFont();
  const params = useLocalSearchParams<{ targetId?: string; targetRole?: string; requestId?: string }>();
  const kind: ComplaintKind = params.targetId ? (params.targetRole === 'customer' ? 'customer' : 'artisan') : 'general';
  const { data: target } = useUser(params.targetId);
  const { data: request } = useRequest(params.requestId ?? '');
  // A customer without a public profile yet still has their name on the job.
  const targetName = target?.fullName || (kind === 'customer' ? request?.customerName : undefined) || '';

  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const needsDetails = reason === 'other' && details.trim().length < OTHER_MIN;

  const submit = async () => {
    if (!reason || needsDetails) return;
    setLoading(true);
    try {
      await submitComplaint({
        reason,
        details,
        target: params.targetId && kind !== 'general' ? { id: params.targetId, name: targetName, role: kind } : undefined,
        request: params.requestId ? { id: params.requestId, title: request?.title ?? '' } : undefined,
      });
      toast('success', t(kind === 'general' ? 'report.sent' : 'report.sentPerson'));
      router.back();
    } catch {
      toast('error', t('report.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Header showBack title={t(kind === 'general' ? 'report.title' : kind === 'artisan' ? 'report.titleArtisan' : 'report.titleCustomer')} />

      {kind !== 'general' && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar uri={target?.photoUrl} name={targetName} size={48} verified={target?.verified} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {targetName || '…'}
            </Text>
            <Text variant="caption" tone="muted">
              {t(kind === 'artisan' ? 'report.roleArtisan' : 'report.roleCustomer')}
            </Text>
            {!!request?.title && (
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {t('report.about')} {request.title}
              </Text>
            )}
          </View>
        </Card>
      )}

      <Text variant="body" tone="muted" style={{ marginBottom: kind === 'general' ? 12 : 20 }}>
        {t(kind === 'general' ? 'report.subtitle' : 'report.subtitlePerson')}
      </Text>
      {kind === 'general' && (
        <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.tint + '12', marginBottom: 20 }}>
          <Icon name="info" size={18} color={colors.tint} />
          <Text variant="caption" style={{ flex: 1 }}>
            {t('report.personHint')}
          </Text>
        </View>
      )}

      <Text variant="caption" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t('report.reason')}
      </Text>
      <View style={{ gap: 10, marginBottom: 20 }}>
        {COMPLAINT_REASONS[kind].map((code) => {
          const active = reason === code;
          return (
            <Pressable
              key={code}
              onPress={() => setReason(code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: active ? colors.tint : colors.border, backgroundColor: active ? colors.tint + '12' : colors.surface }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? colors.tint : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                {active && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.tint }} />}
              </View>
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {t(complaintReasonKey(kind, code) as any)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="caption" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t(reason === 'other' ? 'report.detailsRequired' : 'report.details')}
      </Text>
      <TextInput
        value={details}
        onChangeText={setDetails}
        placeholder={t('report.detailsPlaceholder')}
        placeholderTextColor={colors.muted}
        maxLength={DETAILS_MAX}
        multiline
        style={{ minHeight: 120, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), textAlignVertical: 'top', marginBottom: 20 }}
      />

      <Button label={t(kind === 'general' ? 'report.submit' : 'report.submitPerson')} iconLeft="flag" variant="danger" onPress={submit} loading={loading} disabled={!reason || needsDetails} />
    </Screen>
  );
}
