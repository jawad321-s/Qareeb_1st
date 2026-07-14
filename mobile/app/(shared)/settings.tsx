import React, { useState } from 'react';
import { View, Switch, Pressable } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useThemeStore, type ThemeMode } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function Settings() {
  const { colors } = useTheme();
  const { mode, setMode } = useThemeStore();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [location, setLocation] = useState(true);

  const themeOptions: { key: ThemeMode; label: string; icon: IconName }[] = [
    { key: 'light', label: 'Light', icon: 'sun' },
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'system', label: 'System', icon: 'settings' },
  ];

  return (
    <Screen scroll>
      <Header showBack title="Settings" />

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        APPEARANCE
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
        NOTIFICATIONS
      </Text>
      <Card padded={false} style={{ marginBottom: 22 }}>
        <ToggleRow icon="bell" label="Push notifications" value={push} onChange={setPush} first />
        <ToggleRow icon="mail" label="Email updates" value={email} onChange={setEmail} />
        <ToggleRow icon="map-pin" label="Location services" value={location} onChange={setLocation} />
      </Card>

      <Text variant="overline" tone="muted" style={{ marginBottom: 10, marginLeft: 4 }}>
        ABOUT
      </Text>
      <Card padded={false}>
        <LinkRow icon="shield" label="Privacy policy" first />
        <LinkRow icon="info" label="Terms of service" />
        <LinkRow icon="help-circle" label="Help center" />
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

function LinkRow({ icon, label, first }: { icon: IconName; label: string; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
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
