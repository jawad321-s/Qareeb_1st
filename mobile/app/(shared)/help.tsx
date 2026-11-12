import React, { useState } from 'react';
import { Linking, View, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/feedback/Toast';
import { useSupportContacts } from '@/hooks/queries';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const FAQS = {
  en: [
    { q: 'How do I create a service request?', a: 'Tap the Request tab, pick a category, describe your problem, then submit. Nearby artisans are notified instantly and send you their price.' },
    { q: 'How are artisans verified?', a: 'Every artisan submits ID and certificates which our team reviews before approval. Verified pros show a blue badge.' },
    { q: 'When am I charged?', a: 'You only pay after you accept an offer and the job is completed. Payments are handled securely in-app.' },
    { q: 'Can I cancel a request?', a: 'Yes — open the request and choose cancel. If an artisan is already on the way, a small fee may apply.' },
    { q: 'How do reviews work?', a: 'After a job completes, both you and the artisan rate each other. Ratings help keep quality high for everyone.' },
  ],
  ar: [
    { q: 'كيف أنشئ طلب خدمة؟', a: 'اضغط تبويب "طلب"، اختر فئة، صف مشكلتك، ثم أرسل. يُبلَّغ الحرفيون القريبون فوراً ويرسلون لك أسعارهم.' },
    { q: 'كيف يتم توثيق الحرفيين؟', a: 'يقدّم كل حرفي الهوية والشهادات ويراجعها فريقنا قبل الاعتماد. الحرفيون الموثّقون لهم شارة زرقاء.' },
    { q: 'متى يُخصم المبلغ؟', a: 'تدفع فقط بعد قبولك للعرض وإتمام العمل. تُعالَج المدفوعات بأمان داخل التطبيق.' },
    { q: 'هل يمكنني إلغاء الطلب؟', a: 'نعم — افتح الطلب واختر إلغاء. إذا كان الحرفي في الطريق، قد تُطبَّق رسوم بسيطة.' },
    { q: 'كيف تعمل المراجعات؟', a: 'بعد إتمام العمل، يقيّم كل منكما الآخر. تساعد التقييمات في الحفاظ على جودة عالية للجميع.' },
  ],
};

export default function HelpCenter() {
  const { colors, gradient } = useTheme();
  const { t, locale } = useT();
  const [open, setOpen] = useState<number | null>(0);
  const faqs = FAQS[locale];
  const toast = useToast();
  // Set by the admin (dashboard → Settings); a channel left empty is hidden.
  const contacts = useSupportContacts().data;
  const digits = (n?: string) => (n ?? '').replace(/\D/g, '');
  const channels = [
    contacts?.supportWhatsApp && { label: t('help.whatsapp'), icon: 'message' as const, url: `https://wa.me/${digits(contacts.supportWhatsApp)}` },
    contacts?.supportPhone && { label: t('help.call'), icon: 'phone' as const, url: `tel:${contacts.supportPhone.replace(/\s/g, '')}` },
    contacts?.supportEmail && { label: t('help.email'), icon: 'send' as const, url: `mailto:${contacts.supportEmail}` },
  ].filter(Boolean) as { label: string; icon: 'message' | 'phone' | 'send'; url: string }[];
  const openChannel = (url: string) => Linking.openURL(url).catch(() => toast('error', t('help.openFailed')));

  return (
    <Screen scroll>
      <Header showBack title={t('help.title')} />

      <LinearGradient colors={gradient} style={{ borderRadius: 20, padding: 20, gap: 12, marginBottom: 24 }}>
        <Icon name="help-circle" size={28} color="#FFF" />
        <Text variant="h3" tone="inverse">
          {t('help.howHelp')}
        </Text>
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {t('help.browse')}
        </Text>
        <View style={{ marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {channels.length > 0 ? (
            channels.map((c) => (
              <Button key={c.url} label={c.label} variant="secondary" size="sm" iconLeft={c.icon} onPress={() => openChannel(c.url)} fullWidth={false} />
            ))
          ) : (
            <Button label={t('help.contact')} variant="secondary" size="sm" iconLeft="message" onPress={() => toast('info', t('help.noContacts'))} fullWidth={false} />
          )}
        </View>
      </LinearGradient>

      <Text variant="h3" style={{ marginBottom: 12 }}>
        {t('help.faq')}
      </Text>
      <View style={{ gap: 10 }}>
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <Animated.View key={f.q} entering={FadeInDown.delay(i * 50).duration(350)}>
              <Card padded={false}>
                <Pressable onPress={() => setOpen(isOpen ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
                  <Text variant="bodyMedium" style={{ flex: 1 }}>
                    {f.q}
                  </Text>
                  <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={18} color={colors.muted} />
                </Pressable>
                {isOpen && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <Text variant="body" tone="muted" style={{ lineHeight: 21 }}>
                      {f.a}
                    </Text>
                  </View>
                )}
              </Card>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}
