import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { categoryById } from '@/constants/categories';
import { useArtisan, useServices } from '@/hooks/queries';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/store/auth';
import { useArtisanServices } from '@/store/artisanServices';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const catOrder = (id: string) => categoryById(id)?.order ?? 99;

/**
 * The services this artisan offers. No prices here: an artisan names a price
 * only when quoting a specific request (the offer form). More services can be
 * added from the full catalog, and any of them paused or removed.
 */
export default function MyServices() {
  const { colors, isDark } = useTheme();
  const { t, locale } = useT();
  const uid = useAuth((s) => s.user?.uid ?? '');
  const catalog = useServices();
  const profile = useArtisan(uid);
  const offered = useArtisanServices((s) => s.byUser[uid]);
  const { seed, setActive, remove } = useArtisanServices();

  // First visit: start from the services in the artisan's profile.
  useEffect(() => {
    if (!uid || offered || !catalog.data || !profile.data) return;
    const p = profile.data.profile;
    const initial: Record<string, boolean> = {};
    for (const s of catalog.data) {
      if (p.categoryIds.includes(s.categoryId) || p.serviceIds.includes(s.id)) initial[s.id] = p.serviceIds.includes(s.id);
    }
    seed(uid, initial);
  }, [uid, offered, catalog.data, profile.data, seed]);

  const list = (catalog.data ?? [])
    .filter((s) => offered && s.id in offered)
    .sort((a, b) => catOrder(a.categoryId) - catOrder(b.categoryId));
  const allAdded = !!catalog.data && list.length === catalog.data.length;

  const onRemove = async (serviceId: string) => {
    const ok = await confirmAction({
      title: t('sp.removeTitle'),
      message: t('sp.removeBody'),
      confirmLabel: t('sp.remove'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (ok) remove(uid, serviceId, catalog.data ?? []);
  };

  return (
    <Screen scroll>
      <Header showBack title={t('ap.services')} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 16 }}>
        {t('sp.desc')}
      </Text>

      {!offered ? (
        <View style={{ gap: 12 }}>{[0, 1].map((i) => <CardSkeleton key={i} />)}</View>
      ) : list.length === 0 ? (
        <EmptyState icon="tools" title={t('sp.empty')} description={t('sp.emptyDesc')} />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((s) => {
            const cat = categoryById(s.categoryId);
            const color = cat?.colorHex ?? colors.tint;
            return (
              <Card key={s.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: color + (isDark ? '26' : '14'),
                    }}
                  >
                    <Icon name={s.icon as any} size={20} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {s.name[locale]}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {cat?.name[locale]} · {s.description[locale]}
                    </Text>
                  </View>
                  {/* Same toggle as the dashboard's online switch — the web Switch
                      draws its knob in the wrong place in RTL. */}
                  <Pressable
                    role="switch"
                    aria-checked={offered[s.id]}
                    onPress={() => setActive(uid, s.id, !offered[s.id], catalog.data ?? [])}
                    style={{ width: 46, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center', backgroundColor: offered[s.id] ? colors.tint : colors.border }}
                  >
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF', alignSelf: offered[s.id] ? 'flex-end' : 'flex-start' }} />
                  </Pressable>
                  <Pressable onPress={() => onRemove(s.id)} hitSlop={8} aria-label={t('sp.remove')}>
                    <Icon name="trash" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: 20 }}>
        {allAdded ? (
          <Text variant="caption" tone="muted" center>
            {t('sp.allAdded')}
          </Text>
        ) : (
          <Button label={t('sp.add')} iconLeft="plus" variant="outline" disabled={!offered} onPress={() => router.push('/(shared)/add-service')} />
        )}
      </View>
    </Screen>
  );
}

