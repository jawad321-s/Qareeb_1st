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
import { useTheme } from '@/theme/ThemeProvider';

export default function EditProfile() {
  const { colors } = useTheme();
  const user = useAuth((s) => s.user)!;
  const updateUser = useAuth((s) => s.updateUser);
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [photo, setPhoto] = useState(user.photoUrl);
  const [saving, setSaving] = useState(false);

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateUser({ fullName, email, phone, photoUrl: photo });
    setSaving(false);
    router.back();
  };

  return (
    <Screen scroll>
      <Header showBack title="Edit profile" />
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Pressable onPress={pick}>
          <Avatar uri={photo} name={fullName} size={96} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.tint, borderRadius: 999, padding: 6, borderWidth: 2, borderColor: colors.bg }}>
            <Icon name="camera" size={16} color="#FFF" />
          </View>
        </Pressable>
        <Text variant="caption" tone="primary" style={{ marginTop: 8 }} onPress={pick}>
          Change photo
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <Input label="Full name" iconLeft="user" value={fullName} onChangeText={setFullName} />
        <Input label="Email" iconLeft="mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Phone" iconLeft="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button label="Save changes" onPress={save} loading={saving} style={{ marginTop: 8 }} />
        <Button label="Change password" variant="ghost" iconLeft="lock" onPress={() => router.push('/(shared)/change-password')} />
      </View>
    </Screen>
  );
}
