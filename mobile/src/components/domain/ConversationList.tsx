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
import { useConversations, useHideConversation, useUser } from '@/hooks/queries';
import { useToast } from '../feedback/Toast';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/store/auth';
import { timeAgo } from '@/lib/format';
import { isChatOpen } from '@/lib/requestRules';
import { useT } from '@/i18n';
import type { Conversation } from '@/types';
import { useNow } from '@/hooks/useNow';

/**
 * A thread is listed once it has messages, or while its job is in progress (so
 * the first message can be sent). A finished or cancelled job with no messages
 * is left out.
 */
export const isListed = (c: Conversation) => !!c.lastMessage || isChatOpen(c.request.status);

/**
 * The user's chat history: one thread per request with an assigned artisan,
 * newest first. Threads of finished or cancelled jobs stay readable but are
 * marked closed.
 */
export function ConversationList() {
  const user = useAuth((s) => s.user);
  const { t } = useT();
  const { data: all, isLoading } = useConversations(user);
  const data = all?.filter(isListed);

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
      <Text variant="caption" tone="muted" center style={{ marginTop: 4 }}>
        {t('conv.deleteHint')}
      </Text>
    </View>
  );
}

/** Asks, then deletes the chat for this user only. Resolves true when deleted. */
export function useDeleteChat() {
  const { t } = useT();
  const toast = useToast();
  const hide = useHideConversation();
  return async (uid: string, requestId: string) => {
    const ok = await confirmAction({
      title: t('conv.deleteTitle'),
      message: t('conv.deleteBody'),
      confirmLabel: t('conv.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return false;
    try {
      await hide.mutateAsync({ uid, requestId });
      toast('success', t('conv.deleted'));
      return true;
    } catch {
      toast('error', t('conv.deleteFailed'));
      return false;
    }
  };
}

function ConversationRow({ conversation, myId }: { conversation: Conversation; myId: string }) {
  useNow(); // keeps the relative time moving
  const { t } = useT();
  const deleteChat = useDeleteChat();
  const { request, lastMessage, otherUserId } = conversation;
  const { data: other } = useUser(otherUserId);
  const open = isChatOpen(request.status);
  const unread = !!lastMessage && !lastMessage.read && lastMessage.senderId !== myId;
  const preview = lastMessage
    ? `${lastMessage.senderId === myId ? t('conv.you') : ''}${
        lastMessage.deleted ? t('chat.deleted') : lastMessage.locked ? t('chat.locked') : lastMessage.type === 'image' ? t('chat.photo') : (lastMessage.text ?? '')
      }`
    : t('conv.noMessages');

  return (
    <Card
      onPress={() => router.push(`/(shared)/chat/${request.id}`)}
      // Press and hold: delete this chat (for me).
      onLongPress={() => void deleteChat(myId, request.id)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar uri={other?.photoUrl} name={other?.fullName} size={50} verified={other?.verified} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
            {other?.fullName || (otherUserId === request.customerId ? request.customerName : '') || '…'}
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
