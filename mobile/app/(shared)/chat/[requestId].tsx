import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, View, ScrollView, Pressable, KeyboardAvoidingView, Platform, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { TextArea } from '@/components/ui/TextArea';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { useDeleteMessage, useMarkChatRead, useMessages, useRequest, useSendMessage, useUser } from '@/hooks/queries';
import { useToast } from '@/components/feedback/Toast';
import { isChatOpen } from '@/lib/requestRules';
import { config } from '@/lib/config';
import { confirmAction } from '@/lib/confirm';
import { uploadChatPhoto } from '@/services/media.service';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useFont, useT } from '@/i18n';
import { timeAgo } from '@/lib/format';
import { localizedTextAlign } from '@/i18n/rtl';
import { useDeleteChat } from '@/components/domain/ConversationList';
import { useNow } from '@/hooks/useNow';
import type { ChatMessage } from '@/types';

/** A view whose place on screen can be read (a message bubble). */
type Measurable = { measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void };

/** Photos sent together in one message, at most. */
const MAX_PHOTOS = 10;
/** Width of a photo message's album. */
const ALBUM = 220;

/** The photos of a photo message (older ones carry one, in mediaUrl). */
const photosOf = (m: ChatMessage) => m.mediaUrls?.length ? m.mediaUrls : m.mediaUrl ? [m.mediaUrl] : [];

export default function Chat() {
  useNow(); // keeps the relative time moving
  const { colors, isDark, gradient } = useTheme();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const me = useAuth((s) => s.user)!;
  const { data: messages } = useMessages(requestId!);
  // Opening the chat reads it: the home screen stops counting it as new.
  useMarkChatRead(requestId!, me.uid, messages);
  const send = useSendMessage(requestId!);
  const remove = useDeleteMessage(requestId!);
  const { t, isRTL, locale } = useT();
  const font = useFont();
  const [text, setText] = useState('');
  // Photos picked or taken, shown above the field until sent (or removed).
  const [photos, setPhotos] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  // The message whose long-press menu is open, and where its bubble sits on
  // screen: the menu opens right beside it.
  const [menuFor, setMenuFor] = useState<{ m: ChatMessage; x: number; y: number; w: number; h: number } | null>(null);
  const bubbles = useRef<Record<string, Measurable | null>>({});
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [sending, setSending] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  // Where each message sits in the list, to jump to the one a reply quotes.
  const positions = useRef<Record<string, number>>({});
  const toast = useToast();
  const viewer = usePhotoViewer();
  const deleteChat = useDeleteChat();
  const { data: request } = useRequest(requestId!);
  // The other party: the assigned artisan for a customer, the customer for an artisan.
  const otherId = request ? (me.uid === request.customerId ? request.acceptedArtisanId : request.customerId) : undefined;
  const { data: other } = useUser(otherId);
  // Once the job is completed or cancelled the thread is kept, read-only.
  const open = request ? isChatOpen(request.status) : false;
  const byId = useMemo(() => new Map((messages ?? []).map((m) => [m.id, m])), [messages]);
  const otherName = other?.fullName || (me.uid !== request?.customerId ? request?.customerName : '') || '';

  const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  const nameOf = (m?: ChatMessage) => (!m ? '' : m.senderId === me.uid ? t('chat.you') : otherName);
  const previewOf = (m?: ChatMessage) =>
    !m || m.deleted ? t('chat.deleted') : m.locked ? t('chat.locked') : m.type === 'image' ? t('chat.photo') : (m.text ?? '');

  // ── Photos: picked from the gallery or taken with the camera, several at once.

  const addPhotos = (uris: string[]) => {
    if (photos.length + uris.length > MAX_PHOTOS) toast('info', t('chat.maxPhotos'));
    setPhotos([...photos, ...uris].slice(0, MAX_PHOTOS));
  };

  /** Permission refused: say why, with a way to the phone's settings. */
  const askForSettings = (message: string) => {
    if (Platform.OS === 'web') return toast('info', message);
    Alert.alert(message, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('chat.openSettings'), onPress: () => Linking.openSettings().catch(() => {}) },
    ]);
  };

  const pickPhotos = async () => {
    if (!open) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return toast('info', t('chat.maxPhotos'));
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: room,
        orderedSelection: true,
        quality: 0.8,
      });
      if (!res.canceled) addPhotos(res.assets.map((a) => a.uri));
    } catch {
      askForSettings(t('chat.photosDenied'));
    }
  };

  const takePhoto = async () => {
    if (!open) return;
    if (photos.length >= MAX_PHOTOS) return toast('info', t('chat.maxPhotos'));
    // The first time, the phone asks whether Qareeb may use the camera.
    const perm = await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (!perm?.granted) return askForSettings(t('chat.cameraDenied'));
    try {
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!res.canceled) addPhotos(res.assets.map((a) => a.uri));
    } catch {
      askForSettings(t('chat.cameraDenied'));
    }
  };

  // ── Sending: nothing leaves until the send button (photos first, as one album, then the text).

  const canSend = open && !sending && (!!text.trim() || photos.length > 0);
  const submit = async () => {
    if (!canSend) return;
    const body = text.trim();
    const shots = photos;
    const answering = replyTo;
    setText('');
    setPhotos([]);
    setReplyTo(null);
    setSending(true);
    try {
      if (shots.length) {
        // Live chats upload the photos first; the demo keeps them on the device.
        const urls = config.useMock ? shots : await Promise.all(shots.map((uri) => uploadChatPhoto(requestId!, uri)));
        await send.mutateAsync({ senderId: me.uid, type: 'image', mediaUrls: urls, ...(answering ? { replyTo: answering.id } : {}) });
      }
      if (body) {
        await send.mutateAsync({ senderId: me.uid, type: 'text', text: body, ...(answering && !shots.length ? { replyTo: answering.id } : {}) });
      }
      scrollToEnd();
    } catch {
      // Nothing is lost: what was being sent is back in the field.
      setText((now) => now || body);
      setPhotos((now) => (now.length ? now : shots));
      setReplyTo((now) => now ?? answering);
      toast('error', t('chat.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  // ── Long press: reply, or delete one's own message for everyone.

  const menuActions = (m: ChatMessage) => {
    if (!open || m.deleted) return [];
    const actions: { icon: IconName; label: string; danger?: boolean; run: () => void }[] = [];
    if (!m.locked) actions.push({ icon: 'reply', label: t('chat.reply'), run: () => setReplyTo(m) });
    if (m.senderId === me.uid) actions.push({ icon: 'trash', label: t('chat.deleteForAll'), danger: true, run: () => deleteForAll(m) });
    return actions;
  };

  const openMenu = (m: ChatMessage) => {
    if (!menuActions(m).length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const node = bubbles.current[m.id];
    if (node?.measureInWindow) node.measureInWindow((x, y, w, h) => setMenuFor({ m, x, y, w, h }));
    else setMenuFor({ m, x: win.width / 2 - 100, y: win.height / 2, w: 200, h: 0 });
  };

  const deleteForAll = async (m: ChatMessage) => {
    const ok = await confirmAction({
      title: t('chat.deleteConfirm'),
      message: t('chat.deleteConfirmDesc'),
      confirmLabel: t('chat.deleteForAll'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(m.id);
      if (replyTo?.id === m.id) setReplyTo(null);
    } catch {
      toast('error', t('chat.deleteFailed'));
    }
  };

  /** Tapping a quoted message scrolls to it and lights it up briefly. */
  const jumpTo = (id: string) => {
    const y = positions.current[id];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
    setHighlight(id);
    setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1400);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingHorizontal: 20 }}>
        <Header
          showBack
          title={otherName}
          subtitle={request?.title}
          onTitlePress={otherId ? () => router.push(me.uid === request?.customerId ? `/(shared)/artisan/${otherId}` : `/(shared)/customer/${otherId}`) : undefined}
          // Delete this chat (for me only); back to where they came from.
          rightIcon="trash"
          rightLabel={t('conv.deleteTitle')}
          onRightPress={async () => {
            if (await deleteChat(me.uid, requestId!)) {
              if (router.canGoBack()) router.back();
            }
          }}
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
            const quoted = m.replyTo ? byId.get(m.replyTo) : undefined;
            const shots = photosOf(m);
            const onColor = mine ? '#FFFFFF' : colors.fg;
            return (
              <Animated.View
                key={m.id}
                entering={FadeInUp.duration(250)}
                onLayout={(e) => {
                  positions.current[m.id] = e.nativeEvent.layout.y;
                }}
                style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}
              >
                {!mine && <Avatar uri={other?.photoUrl} name={other?.fullName} size={28} />}
                <Pressable
                  ref={(node) => {
                    bubbles.current[m.id] = node as Measurable | null;
                  }}
                  onLongPress={() => openMenu(m)}
                  delayLongPress={300}
                  style={{
                    maxWidth: '78%',
                    backgroundColor: m.deleted ? 'transparent' : mine ? gradient[1] : colors.surface, // white text: always a deep shade
                    borderWidth: m.deleted || !mine || highlight === m.id ? 1.5 : 0,
                    borderColor: highlight === m.id ? colors.tint : colors.border,
                    borderStyle: m.deleted ? 'dashed' : 'solid',
                    borderRadius: 18,
                    borderBottomRightRadius: mine ? 4 : 18,
                    borderBottomLeftRadius: mine ? 18 : 4,
                    paddingHorizontal: shots.length && !m.deleted ? 6 : 14,
                    paddingTop: shots.length && !m.deleted ? 6 : 10,
                    paddingBottom: 8,
                  }}
                >
                  {m.deleted ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="x-circle" size={15} color={colors.muted} />
                      <Text variant="body" tone="muted" style={{ fontStyle: 'italic' }}>
                        {t('chat.deleted')}
                      </Text>
                    </View>
                  ) : m.locked ? (
                    // Encrypted and couldn't be opened here.
                    <Text variant="body" tone={mine ? 'inverse' : 'muted'} style={{ lineHeight: 20, fontStyle: 'italic' }}>
                      {t('chat.locked')}
                    </Text>
                  ) : (
                    <>
                      {/* The message this one answers: tap to go to it. */}
                      {!!m.replyTo && (
                        <Pressable
                          onPress={() => m.replyTo && jumpTo(m.replyTo)}
                          style={{
                            flexDirection: 'row',
                            gap: 8,
                            marginBottom: 6,
                            marginHorizontal: shots.length ? 4 : 0,
                            padding: 8,
                            borderRadius: 12,
                            backgroundColor: mine ? 'rgba(255,255,255,0.18)' : colors.surface2,
                          }}
                        >
                          <View style={{ width: 3, borderRadius: 2, backgroundColor: mine ? '#FFFFFF' : colors.tint }} />
                          <View style={{ flexShrink: 1 }}>
                            <Text variant="caption" style={{ color: mine ? '#FFFFFF' : colors.tint, fontWeight: '700' }} numberOfLines={1}>
                              {nameOf(quoted)}
                            </Text>
                            <Text variant="caption" style={{ color: mine ? 'rgba(255,255,255,0.9)' : colors.muted }} numberOfLines={2}>
                              {previewOf(quoted)}
                            </Text>
                          </View>
                        </Pressable>
                      )}
                      {shots.length > 0 ? (
                        <Album photos={shots} onOpen={(i) => viewer.open(shots, i)} onLongPress={() => openMenu(m)} />
                      ) : (
                        <Text variant="body" style={{ lineHeight: 20, color: onColor }}>
                          {m.text}
                        </Text>
                      )}
                    </>
                  )}
                  <Text
                    variant="overline"
                    style={{
                      color: mine && !m.deleted ? 'rgba(255,255,255,0.97)' : colors.muted,
                      marginTop: 4,
                      marginHorizontal: shots.length && !m.deleted ? 6 : 0,
                      alignSelf: 'flex-end',
                    }}
                  >
                    {timeAgo(m.createdAt)}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Composer — replaced by a notice once the job has ended */}
        {open ? (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {/* Answering a message: shown above the field until sent or cancelled. */}
            {replyTo && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10 }}>
                <View style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.tint }} />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" tone="primary" style={{ fontWeight: '700' }} numberOfLines={1}>
                    {t('chat.reply')} · {nameOf(replyTo)}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {previewOf(replyTo)}
                  </Text>
                </View>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('chat.cancelReply')}>
                  <Icon name="x" size={18} color={colors.muted} />
                </Pressable>
              </View>
            )}
            {/* Photos waiting to be sent: tap to look, × to drop one. */}
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingTop: 14 }}>
                {photos.map((uri, i) => (
                  <View key={`${i}:${uri}`}>
                    <Pressable onPress={() => viewer.open(photos, i)} accessibilityRole="imagebutton" accessibilityLabel={t('a11y.openPhoto')}>
                      <Image source={{ uri }} style={{ width: 64, height: 64, borderRadius: 12 }} contentFit="cover" />
                    </Pressable>
                    <Pressable
                      onPress={() => setPhotos(photos.filter((_, j) => j !== i))}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('chat.removePhoto')}
                      style={{ position: 'absolute', top: -7, end: -7, width: 22, height: 22, borderRadius: 11, backgroundColor: '#0F172A', borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="x" size={11} color="#FFFFFF" strokeWidth={3} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
              <ComposerButton icon="image" label={t('a11y.sendPhoto')} onPress={pickPhotos} />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 14 }}>
                <TextArea
                  containerStyle={{ flex: 1 }}
                  value={text}
                  onChangeText={setText}
                  placeholder={t('chat.message')}
                  placeholderTextColor={colors.muted}
                  style={{ color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), maxHeight: 100, paddingVertical: 10 }}
                />
              </View>
              <ComposerButton icon="camera" label={t('chat.takePhoto')} onPress={takePhoto} />
              <Pressable
                onPress={submit}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel={t('chat.send')}
                style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: gradient[1], opacity: canSend || sending ? 1 : 0.5, alignItems: 'center', justifyContent: 'center' }}
              >
                {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="send" size={20} color="#FFF" />}
              </Pressable>
            </View>
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

      {/* Long-press menu, beside the message: below it, or above when there
          is no room below; on the message's own side. */}
      <Modal visible={!!menuFor} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenuFor(null)}>
        <Pressable onPress={() => setMenuFor(null)} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', direction: 'ltr' }}>
          {menuFor && (() => {
            const actions = menuActions(menuFor.m);
            const W = 210;
            const H = actions.length * 50 + 12;
            const below = menuFor.y + menuFor.h + 8;
            const top = below + H <= win.height - insets.bottom - 12 ? below : Math.max(insets.top + 8, menuFor.y - 8 - H);
            const onLeft = menuFor.x + menuFor.w / 2 < win.width / 2;
            const left = onLeft ? Math.max(12, menuFor.x) : Math.min(win.width - 12 - W, menuFor.x + menuFor.w - W);
            return (
              <>
                {/* Which message: outlined where it is. */}
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', left: menuFor.x - 3, top: menuFor.y - 3, width: menuFor.w + 6, height: menuFor.h + 6, borderRadius: 20, borderWidth: 2, borderColor: colors.tint }}
                />
                <Animated.View
                  entering={ZoomIn.duration(140)}
                  style={{
                    position: 'absolute',
                    top,
                    left,
                    width: W,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: '#000',
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                    direction: locale === 'ar' ? 'rtl' : 'ltr',
                  }}
                >
                  {actions.map((a, i) => (
                    <Pressable
                      key={a.label}
                      onPress={() => {
                        setMenuFor(null);
                        a.run();
                      }}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        height: 50,
                        paddingHorizontal: 16,
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                        backgroundColor: pressed ? colors.surface2 : 'transparent',
                      })}
                    >
                      <Icon name={a.icon} size={19} color={a.danger ? '#EF4444' : colors.fg} />
                      <Text variant="bodyMedium" style={{ color: a.danger ? '#EF4444' : colors.fg }}>
                        {a.label}
                      </Text>
                    </Pressable>
                  ))}
                </Animated.View>
              </>
            );
          })()}
        </Pressable>
      </Modal>
      {viewer.element}
    </SafeAreaView>
  );
}

function ComposerButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={icon} size={20} color={colors.tint} />
    </Pressable>
  );
}

/**
 * The photos of one message, as an album: one large, two side by side, or a
 * grid of four with "+N" on the last when there are more. Tap opens them full
 * screen.
 */
function Album({ photos, onOpen, onLongPress }: { photos: string[]; onOpen: (i: number) => void; onLongPress: () => void }) {
  const { t } = useT();
  const gap = 4;
  const shown = photos.length > 4 ? photos.slice(0, 4) : photos;
  const size = (i: number) => {
    if (photos.length === 1) return { width: ALBUM, height: ALBUM };
    if (photos.length === 2) return { width: (ALBUM - gap) / 2, height: 160 };
    // Three: the first takes the whole top row.
    if (photos.length === 3 && i === 0) return { width: ALBUM, height: (ALBUM - gap) / 2 };
    return { width: (ALBUM - gap) / 2, height: (ALBUM - gap) / 2 };
  };
  return (
    <View style={{ width: ALBUM, flexDirection: 'row', flexWrap: 'wrap', gap, direction: 'ltr' }}>
      {shown.map((uri, i) => (
        <Pressable
          key={`${i}:${uri}`}
          onPress={() => onOpen(i)}
          onLongPress={onLongPress}
          delayLongPress={300}
          accessibilityRole="imagebutton"
          accessibilityLabel={t('a11y.openPhoto')}
        >
          <Image source={{ uri }} style={{ ...size(i), borderRadius: 12 }} contentFit="cover" transition={150} />
          {i === 3 && photos.length > 4 && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="h2" style={{ color: '#FFFFFF' }}>{`+${photos.length - 4}`}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}
