import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useVerification, type DocSlot } from '@/store/verification';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { radius } from '@/theme/tokens';
import { useToast } from '@/components/feedback/Toast';

async function pickImage(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
    allowsEditing: true,
  });
  return res.canceled ? null : res.assets[0].uri;
}

export default function Verification() {
  const { colors } = useTheme();
  const { t } = useT();
  const showToast = useToast();
  const user = useAuth((s) => s.user);
  const { status, idFront, idBack, selfie, certificates, setDoc, addCertificate, removeCertificate, submit, watch } =
    useVerification();

  const docs: Record<DocSlot, string | undefined> = { idFront, idBack, selfie };
  const canSubmit = !!idFront && !!idBack && status !== 'pending' && status !== 'approved';

  // Live-sync with the admin dashboard's decision (no-op on mock).
  useEffect(() => {
    if (!user) return;
    const unsub = watch(user.uid);
    return unsub;
  }, [user, watch]);

  const onPickDoc = async (slot: DocSlot) => {
    const uri = await pickImage();
    if (uri) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setDoc(slot, uri);
    }
  };

  const onAddCert = async () => {
    const uri = await pickImage();
    if (uri) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      addCertificate(uri);
    }
  };

  const onSubmit = () => {
    if (!idFront || !idBack) {
      showToast('error', t('vrf.needId'));
      return;
    }
    if (user) submit(user);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    showToast('success', t('vrf.submitted'));
    setTimeout(() => router.back(), 900);
  };

  return (
    <Screen scroll>
      <Header showBack title={t('vrf.title')} />

      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 6, marginBottom: 8 }}>
        <Text variant="body" tone="muted">
          {t('vrf.subtitle')}
        </Text>
      </Animated.View>

      {status !== 'unsubmitted' && <StatusBanner status={status} colors={colors} t={t} />}

      {/* ID section */}
      <Animated.View entering={FadeInDown.delay(120).duration(450)} style={{ gap: 12, marginTop: 20 }}>
        <SectionTitle icon="shield" title={t('vrf.idSection')} colors={colors} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <UploadTile style={{ flex: 1 }} label={t('vrf.idFront')} uri={docs.idFront} icon="camera" onPress={() => onPickDoc('idFront')} colors={colors} t={t} />
          <UploadTile style={{ flex: 1 }} label={t('vrf.idBack')} uri={docs.idBack} icon="camera" onPress={() => onPickDoc('idBack')} colors={colors} t={t} />
        </View>
        <UploadTile label={t('vrf.selfie')} optional uri={docs.selfie} icon="camera" onPress={() => onPickDoc('selfie')} colors={colors} t={t} tall={false} />
      </Animated.View>

      {/* Certificates section */}
      <Animated.View entering={FadeInDown.delay(220).duration(450)} style={{ gap: 12, marginTop: 24 }}>
        <SectionTitle icon="check-circle" title={t('vrf.certsSection')} hint={t('vrf.certsHint')} colors={colors} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {certificates.map((c, i) => (
            <Animated.View key={c.id} entering={FadeIn.duration(300)} style={{ width: '47%' }}>
              <View style={{ borderRadius: radius.lg, overflow: 'hidden', height: 120, position: 'relative' }}>
                <Image source={{ uri: c.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    removeCertificate(c.id);
                  }}
                  style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="trash" size={15} color="#FFFFFF" />
                </Pressable>
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <Text variant="overline" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                    {t('vrf.certLabel')} {i + 1}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
          <Pressable onPress={onAddCert} style={{ width: '47%' }}>
            <View
              style={{
                height: 120,
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.border,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon name="plus" size={22} color={colors.tint} />
              <Text variant="caption" tone="muted">
                {t('vrf.addCert')}
              </Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Secure note */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.surface2, padding: 12, borderRadius: radius.md, marginTop: 24 }}>
        <Icon name="shield" size={16} color={colors.tint} />
        <Text variant="caption" tone="muted" style={{ flex: 1 }}>
          {t('vrf.secure')}
        </Text>
      </View>

      <Button label={t('vrf.submit')} iconLeft="check" onPress={onSubmit} disabled={!canSubmit} style={{ marginTop: 20 }} />
      <Pressable onPress={() => router.back()} style={{ paddingVertical: 14 }}>
        <Text variant="body" tone="muted" center>
          {t('vrf.skip')}
        </Text>
      </Pressable>
    </Screen>
  );
}

function SectionTitle({ icon, title, hint, colors }: { icon: IconName; title: string; hint?: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={18} color={colors.tint} />
        <Text variant="bodyMedium">{title}</Text>
      </View>
      {hint && (
        <Text variant="caption" tone="muted" style={{ marginLeft: 26 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

function UploadTile({
  label,
  uri,
  icon,
  optional,
  onPress,
  colors,
  t,
  style,
  tall = true,
}: {
  label: string;
  uri?: string;
  icon: IconName;
  optional?: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  t: (k: any) => string;
  style?: object;
  tall?: boolean;
}) {
  const height = tall ? 130 : 96;
  return (
    <Pressable onPress={onPress} style={style}>
      {uri ? (
        <View style={{ height, borderRadius: radius.lg, overflow: 'hidden', position: 'relative' }}>
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' }} />
          <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full }}>
            <Icon name="camera" size={12} color="#FFFFFF" />
            <Text variant="overline" style={{ color: '#FFFFFF' }}>
              {t('vrf.replace')}
            </Text>
          </View>
          <View style={{ position: 'absolute', bottom: 8, left: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={14} color="#FFFFFF" />
          </View>
        </View>
      ) : (
        <View
          style={{
            height,
            borderRadius: radius.lg,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingHorizontal: 8,
          }}
        >
          <Icon name={icon} size={22} color={colors.muted} />
          <Text variant="caption" tone="muted" center>
            {label}
          </Text>
          <Text variant="overline" style={{ color: colors.tint }}>
            {optional ? t('vrf.optional') : t('vrf.tapToUpload')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function StatusBanner({ status, colors, t }: { status: string; colors: ReturnType<typeof useTheme>['colors']; t: (k: any) => string }) {
  const map: Record<string, { icon: IconName; color: string; label: string; desc?: string }> = {
    pending: { icon: 'clock', color: '#F59E0B', label: t('vrf.statusPending'), desc: t('vrf.pendingDesc') },
    approved: { icon: 'check-circle', color: '#10B981', label: t('vrf.statusApproved') },
    rejected: { icon: 'x', color: '#EF4444', label: t('vrf.statusRejected') },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: s.color + '15', borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: s.color + '40' }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.color + '25', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={s.icon} size={18} color={s.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyMedium" style={{ color: s.color }}>
            {s.label}
          </Text>
          {s.desc && (
            <Text variant="caption" tone="muted">
              {s.desc}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
