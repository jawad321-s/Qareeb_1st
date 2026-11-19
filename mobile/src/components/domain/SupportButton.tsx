import React, { useEffect, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '../ui/Icon';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';
import { subscribeSupportThread } from '@/services/support.service';

/** Whether the Qareeb team answered and the user hasn't read it yet. */
export function useSupportUnread(): boolean {
  const uid = useAuth((s) => s.user?.uid);
  const [unread, setUnread] = useState(false);
  useEffect(() => {
    if (!uid) return;
    return subscribeSupportThread(uid, (thread) => setUnread(!!thread?.unreadForUser));
  }, [uid]);
  return unread;
}

/** Opens the chat with the Qareeb team (home screen header), with a dot for an unread reply. */
export function SupportButton({ style, iconSize = 19 }: { style: ViewStyle; iconSize?: number }) {
  const { colors } = useTheme();
  const { t } = useT();
  const unread = useSupportUnread();
  return (
    <Pressable
      onPress={() => router.push('/(shared)/support')}
      accessibilityRole="button"
      accessibilityLabel={t('support.open')}
      style={[{ backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, style]}
    >
      <Icon name="headphones" size={iconSize} color={colors.fg} />
      {unread && (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#DC2626',
            borderWidth: 2,
            borderColor: colors.bg,
          }}
        />
      )}
    </Pressable>
  );
}
