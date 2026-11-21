import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useLocaleStore } from '@/i18n';
import { directionStyle } from '@/i18n/rtl';
import { formatEta } from '@/lib/format';

const ROW = 44;
const VISIBLE = 5; // rows shown; the middle one is the choice
const HOURS = Array.from({ length: 13 }, (_, i) => i); // 0–12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, … 55

/**
 * A time span (e.g. how soon the artisan can arrive), picked like the
 * iPhone's timer: an hours wheel and a minutes wheel in a sheet. The field
 * shows the choice in words ("1 ساعة و15 دقيقة").
 */
export function DurationField({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const { colors } = useTheme();
  const { t } = useT();
  const isArabic = useLocaleStore((s) => s.locale === 'ar');
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(Math.floor(minutes / 60));
  const [m, setM] = useState(Math.round((minutes % 60) / 5) * 5);

  const show = () => {
    setH(Math.min(Math.floor(minutes / 60), 12));
    setM(Math.min(Math.round((minutes % 60) / 5) * 5, 55));
    setOpen(true);
  };
  const total = h * 60 + m;

  return (
    <>
      <Pressable
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={`${t('job.eta')}: ${formatEta(minutes)}`}
        style={{ height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Icon name="clock" size={18} color={colors.tint} />
        <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
          {minutes > 0 ? formatEta(minutes, true) : t('eta.pick')}
        </Text>
        <Icon name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={[{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }, directionStyle(isArabic)]}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
            <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, gap: 14 }}>
              <Text variant="h3" center>
                {t('eta.title')}
              </Text>
              <View style={{ height: ROW * VISIBLE, overflow: 'hidden', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {/* The band behind the chosen row */}
                <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: ROW * 2, height: ROW, borderRadius: 12, backgroundColor: colors.surface2 }} />
                <Wheel values={HOURS} value={h} onChange={setH} unit={t('eta.hours')} />
                <Wheel values={MINUTES} value={m} onChange={setM} unit={t('eta.minutes')} />
              </View>
              <Text variant="caption" tone="muted" center>
                {total > 0 ? formatEta(total) : '—'}
              </Text>
              <Button
                label={t('common.done')}
                disabled={total <= 0}
                onPress={() => {
                  onChange(total);
                  setOpen(false);
                }}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** One wheel: scroll, it settles on a row; the middle row is the value. */
function Wheel({ values, value, onChange, unit }: { values: number[]; value: number; onChange: (v: number) => void; unit: string }) {
  const { colors } = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shown, setShown] = useState(Math.max(0, values.indexOf(value)));

  // Start on the current value.
  useEffect(() => {
    const i = Math.max(0, values.indexOf(value));
    setShown(i);
    requestAnimationFrame(() => ref.current?.scrollTo({ y: i * ROW, animated: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (i: number, snap: boolean) => {
    const idx = Math.min(Math.max(i, 0), values.length - 1);
    if (snap) ref.current?.scrollTo({ y: idx * ROW, animated: true });
    if (values[idx] !== value) {
      Haptics.selectionAsync().catch(() => {});
      onChange(values[idx]);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ROW);
    if (i !== shown) setShown(Math.min(Math.max(i, 0), values.length - 1));
    // Browsers don't snap: settle once the scrolling stops.
    if (Platform.OS === 'web') {
      if (settle.current) clearTimeout(settle.current);
      settle.current = setTimeout(() => pick(i, true), 140);
    }
  };

  return (
    <View style={{ width: 120, height: ROW * VISIBLE, flexDirection: 'row', alignItems: 'center' }}>
      <ScrollView
        ref={ref}
        style={{ width: 64, height: ROW * VISIBLE, flexGrow: 0 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => pick(Math.round(e.nativeEvent.contentOffset.y / ROW), false)}
        onScrollEndDrag={(e) => pick(Math.round(e.nativeEvent.contentOffset.y / ROW), false)}
        contentContainerStyle={{ paddingVertical: ROW * 2 }}
      >
        {values.map((v, i) => (
          <Pressable key={v} onPress={() => pick(i, true)} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              variant={i === shown ? 'h2' : 'body'}
              style={{ color: i === shown ? colors.fg : colors.muted, opacity: Math.abs(i - shown) > 1 ? 0.45 : 1, writingDirection: 'ltr' }}
            >
              {String(v).padStart(2, '0')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text variant="bodyMedium" tone="muted" style={{ marginStart: 6 }}>
        {unit}
      </Text>
    </View>
  );
}
