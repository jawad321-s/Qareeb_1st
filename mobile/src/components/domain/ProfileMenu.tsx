import React, { useRef, useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../ui/Text';
import { Icon, type IconName } from '../ui/Icon';
import { Card } from '../ui/Card';
import { AnchoredMenu, measureAnchor, type AnchorRect, type Measurable, type MenuOption } from '../ui/AnchoredMenu';
import { useTheme } from '@/theme/ThemeProvider';

export interface ProfileMenuItem {
  icon: IconName;
  label: string;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
  /** A setting with a few values (theme, language): the row opens them beside it. */
  choices?: Omit<MenuOption, 'onPress'>[];
  onChoose?: (key: string) => void;
}

/** The account screen's menu: titled groups of rows (customer and artisan alike). */
export function ProfileMenu({ sections }: { sections: { title: string; items: ProfileMenuItem[] }[] }) {
  const { colors } = useTheme();
  const win = useWindowDimensions();
  const rows = useRef<Record<string, Measurable>>({});
  const [open, setOpen] = useState<{ item: ProfileMenuItem; anchor: AnchorRect } | null>(null);

  const press = (item: ProfileMenuItem) => {
    if (item.choices?.length) {
      measureAnchor(rows.current[item.label], (anchor) => setOpen({ item, anchor }), { x: 20, y: win.height / 2, w: win.width - 40, h: 0 });
      return;
    }
    if (item.onPress) item.onPress();
    else if (item.route) router.push(item.route as any);
  };

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
                ref={(node) => {
                  rows.current[item.label] = node as Measurable;
                }}
                onPress={() => press(item)}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.danger ? '#EF444418' : colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={item.icon} size={18} color={item.danger ? '#EF4444' : colors.tint} />
                </View>
                <Text variant="bodyMedium" style={{ flex: 1 }} tone={item.danger ? 'danger' : 'default'}>
                  {item.label}
                </Text>
                {!item.danger && <Icon name={item.choices ? 'chevron-down' : 'chevron-right'} size={18} color={colors.muted} />}
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
      <AnchoredMenu
        anchor={open?.anchor ?? null}
        align="start"
        onClose={() => setOpen(null)}
        options={(open?.item.choices ?? []).map((c) => ({ ...c, onPress: () => open?.item.onChoose?.(c.key) }))}
      />
    </View>
  );
}
