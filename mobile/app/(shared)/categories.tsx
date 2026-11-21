import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { CategoryTile } from '@/components/domain/CategoryTile';
import { useCategories } from '@/constants/categories';
import { useT } from '@/i18n';

/** Every service category at once (the home screen shows them in a scrolling row). */
export default function AllCategories() {
  const { t, locale } = useT();
  const categories = useCategories();
  return (
    <Screen scroll>
      <Header showBack title={t('cats.title')} subtitle={t('cats.subtitle')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, marginTop: 8 }}>
        {categories.map((cat, i) => (
          <Animated.View key={cat.id} entering={FadeInDown.delay(i * 30).duration(350)} style={{ width: '25%', alignItems: 'center' }}>
            <CategoryTile
              category={cat}
              locale={locale}
              size={64}
              // Picking a category starts a request for it.
              onPress={() => router.push({ pathname: '/(customer)/create', params: { category: cat.id } })}
            />
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}
