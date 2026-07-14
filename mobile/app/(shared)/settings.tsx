import React, { useState } from 'react';
import { View, Switch, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useThemeStore, type ThemeMode } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { Locale } from '@/types';

export default function Settings() {
  const { colors } = useTheme();
  const { mode, setMode } = useThemeStore();
  const { t, locale, setLocale } = useT();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [location, setLocation] = useState(true);

  const themeOptions: { key: ThemeMode; label: string; icon: IconName }[] = [
    { key: 'light', label: t('settings.light'), icon: 'sun' },
    { key: 'dark', label: t('settings.dark'), icon: 'moon' },
    { key: 'system', label: t('settings.system'), icon: 'settings' },
  ];

  const langOptions: { key: Locale; label: string; icon: IconName }[] = [
    { key: 'ar', label: t('settings.arabic'), icon: 'globe' },
    { key: 'en', label: t('settings.english'), icon: 'globe' },
  ];

  return (
    <Screen scroll>
      <Header showBack title={t('settings.title')} />

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t('settings.appearance')}
      </Text>
      <Card padded={false} style={{ marginBottom: 22 }}>
        <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
          {themeOptions.map((o) => {
            const active = mode === o.key;
            return (
              <Pressable key={o.key} onPress={() => setMode(o.key)} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: active ? colors.tint + '15' : colors.surface2, borderWidth: 1.5, borderColor: active ? colors.tint : 'transparent' }}>
                <Icon name={o.icon} size={22} color={active ? colors.tint : colors.muted} />
                <Text variant="caption" tone={active ? 'primary' : 'muted'} style={{ fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t('settings.language')}
      </Text>
      <Card padded={false} style={{ marginBottom: 22 }}>
        <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
          {langOptions.map((o) => {
            const active = locale === o.key;
            return (
              <Pressable key={o.key} onPress={() => setLocale(o.key)} style={{ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: active ? colors.tint + '15' : colors.surface2, borderWidth: 1.5, borderColor: active ? colors.tint : 'transparent' }}>
                <Icon name={o.icon} size={22} color={active ? colors.tint : colors.muted} />
                <Text variant="caption" tone={active ? 'primary' : 'muted'} style={{ fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t('settings.notifications')}
      </Text>
      <Card padded={false} style={{ marginBottom: 22 }}>
        <ToggleRow icon="bell" label={t('settings.pushNotifs')} value={push} onChange={setPush} first />
        <ToggleRow icon="mail" label={t('settings.emailUpdates')} value={email} onChange={setEmail} />
        <ToggleRow icon="map-pin" label={t('settings.locationServices')} value={location} onChange={setLocation} />
      </Card>

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        {t('set.about')}
      </Text>
      <Card padded={false}>
        <LinkRow icon="shield" label={t('set.privacy')} first />
        <LinkRow icon="info" label={t('set.terms')} />
        <LinkRow icon="help-circle" label={t('help.title')} onPress={() => router.push('/(shared)/help')} />
      </Card>
    </Screen>
  );
}

function ToggleRow({ icon, label, value, onChange, first }: { icon: IconName; label: string; value: boolean; onChange: (v: boolean) => void; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={colors.tint} />
      </View>
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.tint, false: colors.border }} thumbColor="#FFF" />
    </View>
  );
}

function LinkRow({ icon, label, first, onPress }: { icon: IconName; label: string; first?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={colors.tint} />
      </View>
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="chevron-right" size={18} color={colors.muted} />
    </Pressable>
  );
}
