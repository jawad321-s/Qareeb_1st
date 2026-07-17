import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

/** Privacy policy / terms of service, selected via the `doc` param. */
export default function Legal() {
  const { colors } = useTheme();
  const { t } = useT();
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const isTerms = doc === 'terms';

  return (
    <Screen scroll>
      <Header showBack title={isTerms ? t('set.terms') : t('set.privacy')} />
      <Card>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.tint + '14',
            }}
          >
            <Icon name={isTerms ? 'info' : 'shield'} size={26} color={colors.tint} />
          </View>
        </View>
        <Text variant="body" style={{ lineHeight: 26 }}>
          {isTerms ? t('legal.termsBody') : t('legal.privacyBody')}
        </Text>
      </Card>
      <Text variant="caption" tone="muted" center style={{ marginTop: 16 }}>
        Qareeb v1.0.0
      </Text>
    </Screen>
  );
}
