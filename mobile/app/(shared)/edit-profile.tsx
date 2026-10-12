import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/store/auth';
import { displayPhone } from '@/lib/phone';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { useT } from '@/i18n';

export default function EditProfile() {
  const { colors } = useTheme();
  const { t } = useT();
  const user = useAuth((s) => s.user)!;
  const updateUser = useAuth((s) => s.updateUser);
  const [fullName, setFullName] = useState(user.fullName);
  const [photo, setPhoto] = useState(user.photoUrl);
  const [saving, setSaving] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateUser({ fullName, photoUrl: photo });
    setSaving(false);
    router.back();
  };

  return (
    <Screen scroll>
      <Header showBack title={t('edit.title')} />
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Pressable onPress={pick}>
          <Avatar uri={photo} name={fullName} size={96} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.tint, borderRadius: 999, padding: 6, borderWidth: 2, borderColor: colors.bg }}>
            <Icon name="camera" size={16} color="#FFF" />
          </View>
        </Pressable>
        <Text variant="caption" tone="primary" style={{ marginTop: 8 }} onPress={pick}>
          {t('edit.changePhoto')}
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <Input label={t('auth.fullName')} iconLeft="user" value={fullName} onChangeText={setFullName} />
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
        <Button label={t('common.save')} onPress={save} loading={saving} style={{ marginTop: 8 }} />
        <Button label={t('edit.changePassword')} variant="ghost" iconLeft="lock" onPress={() => router.push('/(shared)/change-password')} />
      </View>
    </Screen>
  );
}
