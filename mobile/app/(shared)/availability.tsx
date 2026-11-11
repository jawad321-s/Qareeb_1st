import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { kv } from '@/lib/mmkv';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { MOCK_ARTISAN_PROFILE } from '@/mock/data';
import { config } from '@/lib/config';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';

const KEY = 'qareeb.artisan.availability';

interface Availability {
  days: number[]; // 0 = Sunday … 6 = Saturday
  from: string;
  to: string;
}

// New accounts start every day, 08:00–20:00 (same as registration).
const DEFAULT_AVAILABILITY: Availability = { days: [0, 1, 2, 3, 4, 5, 6], from: '08:00', to: '20:00' };

// Every hour of the day. "To" is exclusive; a "To" earlier than "From" runs
// past midnight (20:00 → 02:00), and From = To means the whole day — the same
// rules as lib/availability and the Cloud Functions.
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
const ALL_DAY = { from: '00:00', to: '00:00' };
const isAllDay = (av: Availability) => av.from === av.to;

/** Weekly working days + hours customers can book the artisan in. */
export default function AvailabilityScreen() {
  const { colors } = useTheme();
  const { t } = useT();
  // Live: the artisan's own hours, kept on their profile (artisanProfiles) and
  // cached per account on the device. Demo: the demo artisan's hours.
  const uid = useAuth((s) => s.user?.uid ?? '');
  const key = config.useMock ? KEY : `${KEY}.${uid}`;
  const [av, setAv] = useState<Availability>(
    () => kv.get<Availability>(key) ?? (config.useMock ? { ...MOCK_ARTISAN_PROFILE.availability } : { ...DEFAULT_AVAILABILITY }),
  );

  useEffect(() => {
    const db = getDb();
    if (config.useMock || !db || !uid) return;
    getDoc(doc(db, 'artisanProfiles', uid))
      .then((snap) => {
        const saved = snap.data()?.availability as Availability | undefined;
        if (saved?.days?.length) {
          setAv(saved);
          kv.set(key, saved);
        }
      })
      .catch(() => {});
  }, [uid, key]);

  const save = (next: Availability) => {
    setAv(next);
    kv.set(key, next);
    const db = getDb();
    if (!config.useMock && db && uid) updateDoc(doc(db, 'artisanProfiles', uid), { availability: next }).catch(() => {});
  };

  const allDay = isAllDay(av);
  const toggleAllDay = () => save({ ...av, ...(allDay ? { from: DEFAULT_AVAILABILITY.from, to: DEFAULT_AVAILABILITY.to } : ALL_DAY) });
  const overnight = !allDay && av.to < av.from;

  const toggleDay = (d: number) => {
    const days = av.days.includes(d) ? av.days.filter((x) => x !== d) : [...av.days, d].sort();
    if (days.length === 0) return; // keep at least one working day
    save({ ...av, days });
  };

  return (
    <Screen scroll>
      <Header showBack title={t('ap.availability')} />
      <Text variant="caption" tone="muted" style={{ marginBottom: 20 }}>
        {t('av.desc')}
      </Text>

      <Card style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const active = av.days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(d)}
                style={{
                  flexGrow: 1,
                  minWidth: 74,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 13,
                  backgroundColor: active ? colors.tint : colors.surface2,
                  borderWidth: 1.5,
                  borderColor: active ? colors.tint : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{ color: active ? '#FFFFFF' : colors.muted, fontFamily: 'Inter_600SemiBold' }}
                >
                  {t(`av.day${d}` as TranslationKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Pressable onPress={toggleAllDay} accessibilityRole="switch" accessibilityState={{ checked: allDay }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyMedium">{t('av.allDay')}</Text>
            <Text variant="caption" tone="muted">
              {allDay ? t('av.allDayOn') : `${av.from} – ${av.to}${overnight ? ` ${t('av.nextDay')}` : ''}`}
            </Text>
          </View>
          <View style={{ width: 50, height: 30, borderRadius: 15, padding: 3, backgroundColor: allDay ? colors.tint : colors.surface2, alignItems: allDay ? 'flex-end' : 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' }} />
          </View>
        </Pressable>
      </Card>

      {!allDay && (
        <>
          {/* The other picker's hour is off: From = To would mean the whole day. */}
          <HourPicker label={t('av.from')} value={av.from} blocked={av.to} onChange={(h) => save({ ...av, from: h })} />
          <View style={{ height: 16 }} />
          <HourPicker label={t('av.to')} value={av.to} blocked={av.from} onChange={(h) => save({ ...av, to: h })} />
        </>
      )}
    </Screen>
  );
}

function HourPicker({ label, value, blocked, onChange }: { label: string; value: string; blocked: string; onChange: (h: string) => void }) {
  const { colors } = useTheme();
  return (
    <Card>
      <Text variant="overline" tone="muted" style={{ marginBottom: 10 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {HOURS.map((h) => {
          const active = h === value;
          const off = h === blocked;
          return (
            <Pressable
              key={h}
              onPress={() => onChange(h)}
              disabled={off}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: active ? colors.tint : colors.surface2,
                opacity: off ? 0.35 : 1,
              }}
            >
              <Text
                variant="caption"
                style={{
                  color: active ? '#FFFFFF' : colors.muted,
                  fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {h}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
