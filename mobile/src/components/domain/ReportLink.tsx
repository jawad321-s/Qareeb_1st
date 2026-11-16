import React from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useT } from '@/i18n';

interface Props {
  /** The person the complaint is about. */
  targetId: string;
  targetRole: 'artisan' | 'customer';
  /** The job it is about, when there is one. */
  requestId?: string;
}

/** A quiet "file a complaint about this artisan/customer" link at the end of a page. */
export function ReportLink({ targetId, targetRole, requestId }: Props) {
  const { t } = useT();
  const open = () =>
    router.push({ pathname: '/(shared)/report', params: { targetId, targetRole, ...(requestId ? { requestId } : {}) } });
  return (
    <Pressable
      onPress={open}
      hitSlop={8}
      accessibilityRole="link"
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, paddingVertical: 8 }}
    >
      <Icon name="flag" size={15} color="#DC2626" />
      <Text variant="caption" style={{ color: '#DC2626' }}>
        {t(targetRole === 'artisan' ? 'report.linkArtisan' : 'report.linkCustomer')}
      </Text>
    </Pressable>
  );
}
