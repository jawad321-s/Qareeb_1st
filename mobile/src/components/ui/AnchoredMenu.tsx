import React, { useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocaleStore } from '@/i18n';

/** Where something sits on screen (from measureInWindow). */
export interface AnchorRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MenuOption {
  key: string;
  label: string;
  icon?: IconName;
  danger?: boolean;
  /** The current choice: shown with a check mark. */
  selected?: boolean;
  onPress: () => void;
}

/** A view whose place on screen can be read. */
export type Measurable = { measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void } | null;

/** Reads where `node` sits on screen, then calls `done` with it. */
export function measureAnchor(node: Measurable | undefined, done: (rect: AnchorRect) => void, fallback: AnchorRect) {
  if (node?.measureInWindow) node.measureInWindow((x, y, w, h) => done({ x, y, w, h }));
  else done(fallback);
}

/**
 * A small menu that opens right beside what was pressed: below it, or above
 * when there is no room below. `align`: 'side' keeps it on the side of the
 * screen the thing sits on (a chat bubble); 'start' puts it at the reading
 * start of a wide row (right in Arabic, left in English).
 */
export function AnchoredMenu({
  anchor,
  options,
  onClose,
  outline = false,
  align = 'side',
  width = 210,
}: {
  anchor: AnchorRect | null;
  options: MenuOption[];
  onClose: () => void;
  /** Draw a ring around the pressed thing, so it's clear which one. */
  outline?: boolean;
  align?: 'side' | 'start';
  width?: number;
}) {
  const { colors } = useTheme();
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isArabic = useLocaleStore((s) => s.locale === 'ar');

  let place: { top: number; left: number } | null = null;
  if (anchor) {
    const height = options.length * 50 + 12;
    const below = anchor.y + anchor.h + 8;
    const top = below + height <= win.height - insets.bottom - 12 ? below : Math.max(insets.top + 8, anchor.y - 8 - height);
    const atLeft = align === 'start' ? !isArabic : anchor.x + anchor.w / 2 < win.width / 2;
    const left = atLeft ? Math.max(12, anchor.x) : Math.min(win.width - 12 - width, anchor.x + anchor.w - width);
    place = { top, left: Math.max(12, left) };
  }

  return (
    <Modal visible={!!anchor} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* Physical positions (from measureInWindow), so left-to-right here. */}
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', direction: 'ltr' }}>
        {anchor && place && (
          <>
            {outline && (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: anchor.x - 3, top: anchor.y - 3, width: anchor.w + 6, height: anchor.h + 6, borderRadius: 20, borderWidth: 2, borderColor: colors.tint }}
              />
            )}
            <Animated.View
              entering={ZoomIn.duration(140)}
              style={{
                position: 'absolute',
                top: place.top,
                left: place.left,
                width,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
                direction: isArabic ? 'rtl' : 'ltr',
              }}
            >
              {options.map((o, i) => (
                <MenuRow
                  key={o.key}
                  option={o}
                  first={i === 0}
                  onSelect={() => {
                    onClose();
                    o.onPress();
                  }}
                />
              ))}
            </Animated.View>
          </>
        )}
      </Pressable>
    </Modal>
  );
}

/**
 * One choice: icon, label, and a check on the current one, side by side.
 * Plain styles only: on phones the styling setup (NativeWind) drops a style
 * given as a function of the pressed state, which stacked these rows' parts
 * one under the other. The pressed shade comes from onPressIn/Out instead.
 */
function MenuRow({ option: o, first, onSelect }: { option: MenuOption; first: boolean; onSelect: () => void }) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onSelect}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: !!o.selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 50,
        paddingHorizontal: 16,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        backgroundColor: pressed ? colors.surface2 : 'transparent',
      }}
    >
      {o.icon && <Icon name={o.icon} size={19} color={o.danger ? '#EF4444' : o.selected ? colors.tint : colors.fg} />}
      <Text variant="bodyMedium" style={{ flex: 1, color: o.danger ? '#EF4444' : o.selected ? colors.tint : colors.fg }}>
        {o.label}
      </Text>
      {o.selected && <Icon name="check" size={18} color={colors.tint} strokeWidth={2.5} />}
    </Pressable>
  );
}
