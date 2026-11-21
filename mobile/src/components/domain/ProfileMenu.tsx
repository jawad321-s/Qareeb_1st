import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../ui/Text';
import { Icon, type IconName } from '../ui/Icon';
import { Card } from '../ui/Card';
import { useTheme } from '@/theme/ThemeProvider';

export interface ProfileMenuItem {
  icon: IconName;
  label: string;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
}

/** The account screen's menu: titled groups of rows (customer and artisan alike). */
export function ProfileMenu({ sections }: { sections: { title: string; items: ProfileMenuItem[] }[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 22 }}>
      {sections.map((section) => (
        <View key={section.title} style={{ gap: 10 }}>
          <Text variant="caption" tone="muted" style={{ marginLeft: 4 }}>
            {section.title.toUpperCase()}
          </Text>
          <Card padded={false}>
            {section.items.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={item.onPress ?? (item.route ? () => router.push(item.route as any) : undefined)}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.danger ? '#EF444418' : colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={item.icon} size={18} color={item.danger ? '#EF4444' : colors.tint} />
                </View>
                <Text variant="bodyMedium" style={{ flex: 1 }} tone={item.danger ? 'danger' : 'default'}>
                  {item.label}
                </Text>
                {!item.danger && <Icon name="chevron-right" size={18} color={colors.muted} />}
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
    </View>
  );
}
