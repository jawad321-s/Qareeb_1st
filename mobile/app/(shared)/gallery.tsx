import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/feedback/Toast';
import { useArtisan } from '@/hooks/queries';
import { kv } from '@/lib/mmkv';
import { qk } from '@/lib/queryClient';
import { MOCK_ARTISAN_PROFILE } from '@/mock/data';
import { config } from '@/lib/config';
import { addGalleryPhoto, removeGalleryPhoto } from '@/services/media.service';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const KEY = 'qareeb.artisan.gallery';

/** Artisan work gallery — the photos customers see on the public profile. */
export default function Gallery() {
  const { colors } = useTheme();
  const { t } = useT();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const qc = useQueryClient();
  const uid = useAuth((s) => s.user?.uid ?? '');
  // Live: the photos are uploaded to Storage and listed on the artisan's
  // profile, so every customer sees them. The demo keeps them on the device.
  const live = !config.useMock;
  const artisan = useArtisan(live ? uid : '');
  const [local, setLocal] = useState<string[]>(() => (live ? [] : (kv.get<string[]>(KEY) ?? MOCK_ARTISAN_PROFILE.gallery)));
  const photos = live ? (artisan.data?.profile.gallery ?? []) : local;
  const [uploading, setUploading] = useState(false);

  // 2-column grid inside the 20px screen padding, with a 12px gutter.
  const tile = (width - 40 - 12) / 2;

  const saveLocal = (next: string[]) => {
    setLocal(next);
    kv.set(KEY, next);
  };

  const addPhoto = async () => {
    if (uploading) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;
    const uri = res.assets[0].uri;
    if (!live) return saveLocal([uri, ...photos]);
    setUploading(true);
    try {
      await addGalleryPhoto(uid, uri);
      await qc.invalidateQueries({ queryKey: qk.artisan(uid) });
    } catch {
      toast('error', t('gal.failed'));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (uri: string) => {
    if (!live) return saveLocal(photos.filter((p) => p !== uri));
    try {
      await removeGalleryPhoto(uid, uri);
      await qc.invalidateQueries({ queryKey: qk.artisan(uid) });
    } catch {
      toast('error', t('gal.removeFailed'));
    }
  };

  return (
    <Screen scroll>
      <Header showBack title={t('ap.gallery')} subtitle={`${photos.length} ${t('gal.photos')}`} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 16 }}>
        {t('gal.desc')}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {/* Add tile first so it's always reachable */}
        <Pressable
          onPress={addPhoto}
          disabled={uploading}
          style={{
            width: tile,
            height: tile,
            borderRadius: 18,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.tint,
            backgroundColor: colors.tint + '0D',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.tint + '1A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {uploading ? <ActivityIndicator color={colors.tint} /> : <Icon name="plus" size={22} color={colors.tint} />}
          </View>
          <Text variant="caption" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {uploading ? t('gal.uploading') : t('gal.add')}
          </Text>
        </Pressable>

        {photos.map((uri) => (
          <View key={uri} style={{ width: tile, height: tile, borderRadius: 18, overflow: 'hidden' }}>
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
            <Pressable
              onPress={() => removePhoto(uri)}
              hitSlop={8}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: 'rgba(15,23,42,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="x" size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
      </View>
    </Screen>
  );
}
