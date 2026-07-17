import React, { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { kv } from '@/lib/mmkv';
import { MOCK_ARTISAN_PROFILE } from '@/mock/data';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const KEY = 'qareeb.artisan.gallery';

/** Artisan work gallery — the photos customers see on the public profile. */
export default function Gallery() {
  const { colors } = useTheme();
  const { t } = useT();
  const { width } = useWindowDimensions();
  const [photos, setPhotos] = useState<string[]>(() => kv.get<string[]>(KEY) ?? MOCK_ARTISAN_PROFILE.gallery);

  // 2-column grid inside the 20px screen padding, with a 12px gutter.
  const tile = (width - 40 - 12) / 2;

  const save = (next: string[]) => {
    setPhotos(next);
    kv.set(KEY, next);
  };

  const addPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) save([res.assets[0].uri, ...photos]);
  };

  const removePhoto = (uri: string) => save(photos.filter((p) => p !== uri));

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
            <Icon name="plus" size={22} color={colors.tint} />
          </View>
          <Text variant="caption" tone="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {t('gal.add')}
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
