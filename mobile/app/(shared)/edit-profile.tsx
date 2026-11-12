import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useToast } from '@/components/feedback/Toast';
import { useArtisan } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { api } from '@/services/api';
import { uploadAvatar } from '@/services/media.service';
import { config } from '@/lib/config';
import { qk } from '@/lib/queryClient';
import { displayPhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useT } from '@/i18n';

const NAME_MIN = 2;
const BIO_MIN = 10;

/**
 * Edit profile, the same screen for customers and artisans: photo, name, the
 * phone number (shown, not editable) and the password. Artisans also edit the
 * "About" text customers read on their public profile.
 */
export default function EditProfile() {
  const { colors } = useTheme();
  const { t } = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user)!;
  const updateUser = useAuth((s) => s.updateUser);
  const isArtisan = user.role === 'artisan';
  const artisan = useArtisan(isArtisan ? user.uid : '');
  const [fullName, setFullName] = useState(user.fullName);
  const [photo, setPhoto] = useState(user.photoUrl);
  const [bio, setBio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The artisan's current "About" text, once loaded.
  const savedBio = artisan.data?.profile.bio ?? '';
  useEffect(() => {
    if (isArtisan && artisan.data && bio === null) setBio(savedBio);
  }, [isArtisan, artisan.data, bio, savedBio]);

  const nameOk = fullName.trim().length >= NAME_MIN;
  const bioOk = !isArtisan || (bio ?? savedBio).trim().length >= BIO_MIN;

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const save = async () => {
    if (!nameOk || !bioOk) return;
    setSaving(true);
    try {
      // A new photo is a file on this phone: upload it so others can see it.
      let photoUrl = photo;
      if (!config.useMock && photo && photo !== user.photoUrl && !/^https?:\/\//.test(photo)) {
        photoUrl = await uploadAvatar(user.uid, photo);
      }
      await updateUser({ fullName: fullName.trim(), photoUrl });
      if (isArtisan && bio !== null && bio.trim() !== savedBio) {
        await api.setBio(user.uid, bio.trim());
        qc.invalidateQueries({ queryKey: qk.artisan(user.uid) });
      }
      toast('success', t('edit.saved'));
      router.back();
    } catch {
      toast('error', t('edit.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header showBack title={t('edit.title')} />
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Pressable onPress={pick}>
          <Avatar uri={photo} name={fullName} size={96} verified={user.verified} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.tint, borderRadius: 999, padding: 6, borderWidth: 2, borderColor: colors.bg }}>
            <Icon name="camera" size={16} color="#FFF" />
          </View>
        </Pressable>
        <Text variant="caption" tone="primary" style={{ marginTop: 8 }} onPress={pick}>
          {t('edit.changePhoto')}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <Input
          label={t('auth.fullName')}
          iconLeft="user"
          value={fullName}
          onChangeText={setFullName}
          error={nameOk ? undefined : t('auth.errName')}
        />
        {/* The phone number is the account itself, so it isn't editable here. */}
        <View style={{ gap: 6 }}>
          <Text variant="caption" tone="muted" style={{ marginLeft: 4 }}>
            {t('auth.phone')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface2 }}>
            <Icon name="phone" size={20} color={colors.muted} />
            <Text variant="body" style={{ flex: 1 }}>
              {displayPhone(user.phone)}
            </Text>
            <Icon name="lock" size={16} color={colors.muted} />
          </View>
          <Text variant="caption" tone="muted" style={{ marginLeft: 4 }}>
            {t('edit.phoneLocked')}
          </Text>
        </View>
        {isArtisan && (
          <Input
            label={t('auth.bio')}
            multiline
            value={bio ?? savedBio}
            onChangeText={setBio}
            error={bioOk ? undefined : t('auth.errBio')}
          />
        )}
        <Button label={t('common.save')} onPress={save} loading={saving} disabled={!nameOk || !bioOk} style={{ marginTop: 8 }} />
        <Button label={t('edit.changePassword')} variant="ghost" iconLeft="lock" onPress={() => router.push('/(shared)/change-password')} />
      </View>
    </Screen>
  );
}
