import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { keyboardScrollProps } from '@/components/ui/Screen';
import { REASONS, reasonKey, type Reason, type ReasonContext } from '@/lib/reasons';
import { directionStyle, localizedTextAlign } from '@/i18n/rtl';
import { useFont, useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  visible: boolean;
  context: ReasonContext;
  title: string;
  confirmLabel: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (reason: Reason) => void;
}

/**
 * Asks why, before a request is cancelled or an offer turned down: pick one
 * reason, and add a few words (required for "other"). The other party is told.
 */
export function ReasonSheet({ visible, context, title, confirmLabel, loading, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const { t, isRTL } = useT();
  const font = useFont();
  const [choice, setChoice] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Fresh each time it opens.
  useEffect(() => {
    if (visible) {
      setChoice(null);
      setNote('');
    }
  }, [visible]);

  const needsNote = choice === 'other';
  const ready = !!choice && (!needsNote || note.trim().length >= 3);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#0008' }} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={[{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }, directionStyle(isRTL)]}>
        <ScrollView {...keyboardScrollProps} contentContainerStyle={{ padding: 20, gap: 12 }}>
          <Text variant="h3">{title}</Text>
          <Text variant="caption" tone="muted">
            {t('reason.ask')}
          </Text>
          {REASONS[context].map((code) => {
            const active = choice === code;
            return (
              <Pressable
                key={code}
                onPress={() => setChoice(code)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: active ? colors.tint : colors.border, backgroundColor: active ? colors.tint + '12' : colors.surface }}
              >
                <Icon name={active ? 'check-circle' : 'help-circle'} size={18} color={active ? colors.tint : colors.muted} />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {t(reasonKey(code))}
                </Text>
              </Pressable>
            );
          })}
          <TextArea
            value={note}
            onChangeText={setNote}
            placeholder={needsNote ? t('reason.noteRequired') : t('reason.noteOptional')}
            placeholderTextColor={colors.muted}
            maxLength={300}
            style={{ minHeight: 70, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, padding: 12, color: colors.fg, fontSize: 15, fontFamily: font('Inter_400Regular'), textAlign: localizedTextAlign(isRTL), textAlignVertical: 'top' }}
          />
          <Button label={confirmLabel} variant="danger" disabled={!ready} loading={loading} onPress={() => choice && onSubmit({ choice, note: note.trim() || undefined })} />
          <Button label={t('reason.keep')} variant="ghost" onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
