import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/i18n';

const FAQS = {
  en: [
    { q: 'How do I create a service request?', a: 'Tap the Request tab, pick a category, describe your problem, set your budget and preferred time, then submit. Nearby artisans are notified instantly.' },
    { q: 'How are artisans verified?', a: 'Every artisan submits ID and certificates which our team reviews before approval. Verified pros show a blue badge.' },
    { q: 'When am I charged?', a: 'You only pay after you accept an offer and the job is completed. Payments are handled securely in-app.' },
    { q: 'Can I cancel a request?', a: 'Yes — open the request and choose cancel. If an artisan is already on the way, a small fee may apply.' },
    { q: 'How do reviews work?', a: 'After a job completes, both you and the artisan rate each other. Ratings help keep quality high for everyone.' },
  ],
  ar: [
    { q: 'كيف أنشئ طلب خدمة؟', a: 'اضغط تبويب "طلب"، اختر فئة، صف مشكلتك، حدّد ميزانيتك والوقت المناسب، ثم أرسل. يُبلَّغ الحرفيون القريبون فوراً.' },
    { q: 'كيف يتم توثيق الحرفيين؟', a: 'يقدّم كل حرفي الهوية والشهادات ويراجعها فريقنا قبل الاعتماد. الحرفيون الموثّقون لهم شارة زرقاء.' },
    { q: 'متى يُخصم المبلغ؟', a: 'تدفع فقط بعد قبولك للعرض وإتمام العمل. تُعالَج المدفوعات بأمان داخل التطبيق.' },
    { q: 'هل يمكنني إلغاء الطلب؟', a: 'نعم — افتح الطلب واختر إلغاء. إذا كان الحرفي في الطريق، قد تُطبَّق رسوم بسيطة.' },
    { q: 'كيف تعمل المراجعات؟', a: 'بعد إتمام العمل، يقيّم كل منكما الآخر. تساعد التقييمات في الحفاظ على جودة عالية للجميع.' },
  ],
};

export default function HelpCenter() {
  const { colors } = useTheme();
  const { t, locale } = useT();
  const [open, setOpen] = useState<number | null>(0);
  const faqs = FAQS[locale];

  return (
    <Screen scroll>
      <Header showBack title={t('help.title')} />

      <LinearGradient colors={['#4F46E5', '#06B6D4']} style={{ borderRadius: 20, padding: 20, gap: 12, marginBottom: 24 }}>
        <Icon name="help-circle" size={28} color="#FFF" />
        <Text variant="h3" tone="inverse">
          {t('help.howHelp')}
        </Text>
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {t('help.browse')}
        </Text>
        <View style={{ marginTop: 4 }}>
          <Button label={t('help.contact')} variant="secondary" size="sm" iconLeft="message" onPress={() => {}} fullWidth={false} />
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
