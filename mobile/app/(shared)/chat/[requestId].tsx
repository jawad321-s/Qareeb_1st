import React, { useRef, useState } from 'react';
import { ActivityIndicator, View, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, type ScrollViewInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { useMessages, useRequest, useSendMessage, useUser } from '@/hooks/queries';
import { useToast } from '@/components/feedback/Toast';
import { isChatOpen } from '@/lib/requestRules';
import { config } from '@/lib/config';
import { uploadChatPhoto } from '@/services/media.service';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { timeAgo } from '@/lib/format';
import { localizedTextAlign } from '@/i18n/rtl';

export default function Chat() {
  const { colors, isDark } = useTheme();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const me = useAuth((s) => s.user)!;
  const { data: messages } = useMessages(requestId!);
  const send = useSendMessage(requestId!);
  const { t, isRTL } = useT();
  const font = useFont();
  const [text, setText] = useState('');
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const toast = useToast();
  const { data: request } = useRequest(requestId!);
  // The other party: the assigned artisan for a customer, the customer for an artisan.
  const otherId = request ? (me.uid === request.customerId ? request.acceptedArtisanId : request.customerId) : undefined;
  const { data: other } = useUser(otherId);
  // Once the job is completed or cancelled the thread is kept, read-only.
  const open = request ? isChatOpen(request.status) : false;

  const submit = () => {
    if (!text.trim() || !open) return;
    send.mutate({ senderId: me.uid, type: 'text', text: text.trim() }, { onError: () => toast('error', t('chat.sendFailed')) });
    setText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const sendPhoto = async () => {
    if (!open || sendingPhoto) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;
    setSendingPhoto(true);
    try {
      // Live chats upload the photo first; the demo keeps it on the device.
      const uri = res.assets[0].uri;
      const mediaUrl = config.useMock ? uri : await uploadChatPhoto(requestId!, uri);
      await send.mutateAsync({ senderId: me.uid, type: 'image', mediaUrl });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch {
      toast('error', t('chat.sendFailed'));
    } finally {
      setSendingPhoto(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 20 }}>
        <Header
          showBack
          title={other?.fullName ?? ''}
          subtitle={request?.title}
          onTitlePress={otherId ? () => router.push(me.uid === request?.customerId ? `/(shared)/artisan/${otherId}` : `/(shared)/customer/${otherId}`) : undefined}
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {(messages ?? []).map((m) => {
            const mine = m.senderId === me.uid;
            return (
              <Animated.View
                key={m.id}
                entering={FadeInUp.duration(250)}
                style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}
              >
                {!mine && <Avatar uri={other?.photoUrl} name={other?.fullName} size={28} />}
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
                  {m.type === 'image' && m.mediaUrl ? (
                    <Image source={{ uri: m.mediaUrl }} style={{ width: 200, height: 200, borderRadius: 12 }} contentFit="cover" transition={150} />
                  ) : (
                    <Text variant="body" tone={mine ? 'inverse' : 'default'} style={{ lineHeight: 20 }}>
                      {m.text}
                    </Text>
                  )}
                  <Text variant="overline" style={{ color: mine ? 'rgba(255,255,255,0.7)' : colors.muted, marginTop: 4, alignSelf: 'flex-end' }}>
                    {timeAgo(m.createdAt)}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Composer — replaced by a notice once the job has ended */}
        {open ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={sendPhoto}
              disabled={sendingPhoto}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}
            >
              {sendingPhoto ? <ActivityIndicator size="small" color={colors.tint} /> : <Icon name="image" size={20} color={colors.tint} />}
            </Pressable>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 14 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('chat.message')}
                placeholderTextColor={colors.muted}
                multiline
                style={{ flex: 1, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), maxHeight: 100, paddingVertical: 10 }}
              />
              <Pressable hitSlop={6}>
                <Icon name="mic" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Pressable onPress={submit} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="send" size={20} color="#FFF" />
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Icon name="lock" size={16} color={colors.muted} />
            <Text variant="caption" tone="muted">
              {t('chat.closed')}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
