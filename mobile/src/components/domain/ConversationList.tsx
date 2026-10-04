import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { CardSkeleton } from '../feedback/Skeleton';
import { EmptyState } from '../feedback/EmptyState';
import { useConversations, useUser } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { timeAgo } from '@/lib/format';
import { isChatOpen } from '@/lib/requestRules';
import { useT } from '@/i18n';
import type { Conversation } from '@/types';

/**
 * The user's chat history: one thread per request with an assigned artisan,
 * newest first. Threads of finished or cancelled jobs stay readable but are
 * marked closed.
 */
export function ConversationList() {
  const user = useAuth((s) => s.user);
  const { t } = useT();
  const { data, isLoading } = useConversations(user);

  if (isLoading) return <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</View>;

  if (!data?.length) {
    return (
      <View style={{ marginTop: 60 }}>
        <EmptyState icon="message" title={t('conv.empty')} description={t('conv.emptyDesc')} />
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {data.map((c) => (
        <Animated.View key={c.request.id} entering={FadeIn.duration(300)}>
          <ConversationRow conversation={c} myId={user!.uid} />
        </Animated.View>
      ))}
    </View>
  );
}

function ConversationRow({ conversation, myId }: { conversation: Conversation; myId: string }) {
  const { t } = useT();
  const { request, lastMessage, otherUserId } = conversation;
  const { data: other } = useUser(otherUserId);
  const open = isChatOpen(request.status);
  const unread = !!lastMessage && !lastMessage.read && lastMessage.senderId !== myId;
  const preview = lastMessage
    ? `${lastMessage.senderId === myId ? t('conv.you') : ''}${lastMessage.text ?? ''}`
    : t('conv.noMessages');

  return (
    <Card onPress={() => router.push(`/(shared)/chat/${request.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar uri={other?.photoUrl} name={other?.fullName} size={50} verified={other?.verified} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {other?.fullName ?? '…'}
          </Text>
          <Text variant="caption" tone="muted">
            {timeAgo(lastMessage?.createdAt ?? request.updatedAt)}
          </Text>
        </View>
        <Text variant="caption" tone="primary" numberOfLines={1}>
          {request.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            variant="caption"
            tone={unread ? 'default' : 'muted'}
            numberOfLines={1}
            style={{ flex: 1, fontFamily: unread ? 'Inter_600SemiBold' : undefined }}
          >
            {preview}
          </Text>
          {!open && <Badge label={t('conv.closed')} variant="neutral" />}
          {open && unread && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />}
        </View>
      </View>
    </Card>
  );
}
