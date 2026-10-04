import React from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTabBarSpace } from '@/components/ui/TabBar';
import { ConversationList } from '@/components/domain/ConversationList';
import { useT } from '@/i18n';

/** Customer tab: chat history with the artisans on their requests. */
export default function Messages() {
  const { t } = useT();
  const tabBarSpace = useTabBarSpace();
  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <Text variant="h1">{t('conv.title')}</Text>
        <Text variant="caption" tone="muted" style={{ marginTop: 4 }}>
          {t('conv.subtitle')}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: tabBarSpace + 16 }} showsVerticalScrollIndicator={false}>
        <ConversationList />
      </ScrollView>
    </Screen>
  );
}
