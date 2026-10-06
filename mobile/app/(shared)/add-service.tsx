import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { useToast } from '@/components/feedback/Toast';
import { CATEGORIES } from '@/constants/categories';
import { useServices } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useArtisanServices } from '@/store/artisanServices';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

/**
 * Add services to the artisan's list from the catalog (one general service
 * per category). Services already on the list are shown as added.
 */
export default function AddService() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useT();
  const toast = useToast();
  const uid = useAuth((s) => s.user?.uid ?? '');
  const catalog = useServices();
  const offered = useArtisanServices((s) => s.byUser[uid]) ?? {};
  const add = useArtisanServices((s) => s.add);
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const confirm = () => {
    add(uid, picked, catalog.data ?? []);
    toast('success', t('sp.addedToast'));
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header showBack title={t('sp.addTitle')} />
        <Text variant="caption" tone="muted" style={{ marginBottom: 12 }}>
          {t('sp.addDesc')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }} showsVerticalScrollIndicator={false}>
        {catalog.isLoading
          ? [0, 1, 2].map((i) => <CardSkeleton key={i} />)
          : (catalog.data ?? []).map((s) => {
              const cat = CATEGORIES.find((c) => c.id === s.categoryId);
              const color = cat?.colorHex ?? colors.tint;
              const already = s.id in offered;
              const on = picked.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  disabled={already}
                  onPress={() => toggle(s.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: on ? colors.tint : colors.border,
                    backgroundColor: on ? colors.tint + (isDark ? '22' : '10') : colors.card,
                    opacity: already ? 0.6 : 1,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: color + (isDark ? '26' : '14') }}>
                    <Icon name={s.icon as any} size={19} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{s.name[locale]}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {s.description[locale]}
                    </Text>
                  </View>
                  {already ? (
                    <Badge label={t('sp.added')} variant="success" icon="check-circle" />
                  ) : (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: on ? colors.tint : colors.border,
                        backgroundColor: on ? colors.tint : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {on && <Icon name="check" size={14} color="#FFF" />}
                    </View>
                  )}
                </Pressable>
              );
            })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button
          label={picked.length ? `${t('sp.addSelected')} (${picked.length})` : t('sp.addSelected')}
          iconLeft="plus"
          disabled={!picked.length}
          onPress={confirm}
        />
      </View>
    </SafeAreaView>
  );
}
