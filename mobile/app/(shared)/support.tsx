import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/feedback/Toast';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { localizedTextAlign } from '@/i18n/rtl';
import { timeAgo } from '@/lib/format';
import {
  SUPPORT_TEXT_MAX,
  markSupportRead,
  sendSupportMessage,
  subscribeSupportMessages,
  type SupportMessage,
} from '@/services/support.service';

/**
 * Chat with the Qareeb team (answered from the dashboard → Support). Reached
 * from the home screen, Help, and the "account suspended" screen, where it is
 * the only thing a suspended account can use.
 */
export default function Support() {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useT();
  const font = useFont();
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    return subscribeSupportMessages(uid, setMessages, () => setMessages([]));
  }, [uid]);

  // Seen: the team's replies stop showing as new on the home screen.
  const lastFrom = messages?.[messages.length - 1]?.from;
  useEffect(() => {
    if (uid && lastFrom === 'admin') void markSupportRead(uid);
  }, [uid, lastFrom, messages?.length]);

  if (!user) return null;

  const submit = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendSupportMessage(user, body);
      setText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      toast('error', t('chat.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const firstName = (user.fullName ?? '').split(' ')[0];
  // A greeting from the team opens every thread (shown here, not stored).
  const intro: SupportMessage = { id: 'intro', from: 'admin', senderId: 'team', text: t('support.intro').replace('{name}', firstName), createdAt: 0 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 20 }}>
        <Header showBack title={t('support.team')} subtitle={t('support.subtitle')} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {[intro, ...(messages ?? [])].map((m) => {
            const mine = m.from === 'user';
            return (
              <Animated.View
                key={m.id}
                entering={FadeInUp.duration(250)}
                style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}
              >
                {!mine && (
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="headphones" size={16} color="#FFF" />
                  </View>
                )}
                <View
                  style={{
                    maxWidth: '76%',
                    backgroundColor: mine ? colors.tint : colors.surface,
                    borderWidth: mine ? 0 : 1,
                    borderColor: colors.border,
                    borderRadius: 18,
                    borderBottomRightRadius: mine ? 4 : 18,
                    borderBottomLeftRadius: mine ? 18 : 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  {!mine && (
                    <Text variant="overline" tone="primary" style={{ marginBottom: 2 }}>
                      {t('support.team')}
                    </Text>
                  )}
                  <Text variant="body" tone={mine ? 'inverse' : 'default'} style={{ lineHeight: 20 }}>
                    {m.text}
                  </Text>
                  {m.createdAt > 0 && (
                    <Text variant="overline" style={{ color: mine ? 'rgba(255,255,255,0.7)' : colors.muted, marginTop: 4, alignSelf: 'flex-end' }}>
                      {timeAgo(m.createdAt)}
                    </Text>
                  )}
                </View>
              </Animated.View>
            );
          })}
          {messages === null && <ActivityIndicator color={colors.tint} style={{ marginTop: 12 }} />}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 14 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('support.message')}
              placeholderTextColor={colors.muted}
              multiline
              maxLength={SUPPORT_TEXT_MAX}
              style={{ flex: 1, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), maxHeight: 100, paddingVertical: 10 }}
            />
          </View>
          <Pressable
            onPress={submit}
            disabled={sending || !text.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('chat.send')}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.tint, opacity: text.trim() ? 1 : 0.5, alignItems: 'center', justifyContent: 'center' }}
          >
            {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Icon name="send" size={20} color="#FFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
