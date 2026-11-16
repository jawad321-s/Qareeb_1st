import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

/** "Can't find your service? Suggest it" — under a list of services. */
export function SuggestServiceLink({ label }: { label: string }) {
  const { colors } = useTheme();
  const { t } = useT();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border }}
    >
      <Icon name="lightbulb" size={20} color={colors.tint} />
      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
        {label}
      </Text>
      <Button label={t('suggest.cta')} size="sm" variant="outline" fullWidth={false} onPress={() => router.push('/(shared)/suggest')} />
    </View>
  );
}
