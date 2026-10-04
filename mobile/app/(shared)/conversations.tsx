import React from 'react';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { ConversationList } from '@/components/domain/ConversationList';
import { useT } from '@/i18n';

/** Artisan's chat history (opened from their profile). */
export default function Conversations() {
  const { t } = useT();
  return (
    <Screen scroll>
      <Header showBack title={t('ap.conversations')} />
      <ConversationList />
    </Screen>
  );
}
