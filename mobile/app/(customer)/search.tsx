import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SearchBar } from '@/components/ui/SearchBar';
import { ServiceCard } from '@/components/domain/ServiceCard';
import { CardSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CATEGORIES } from '@/constants/categories';
import { useServices } from '@/hooks/queries';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/theme/ThemeProvider';

type SortKey = 'popular' | 'price' | 'name';

export default function Search() {
  const { colors } = useTheme();
  const locale = useAuth((s) => s.user?.locale ?? 'en');
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [sort, setSort] = useState<SortKey>('popular');

  const { data, isLoading } = useServices();

  const results = useMemo(() => {
    let list = data ?? [];
    if (category) list = list.filter((s) => s.categoryId === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => s.name.en.toLowerCase().includes(q) || s.name.ar.includes(query) || s.description.en.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      if (sort === 'price') return a.basePriceFrom - b.basePriceFrom;
      if (sort === 'name') return a.name.en.localeCompare(b.name.en);
      return Number(b.popular) - Number(a.popular);
    });
    return list;
  }, [data, category, query, sort]);

  const chip = (active: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: active ? colors.tint : colors.surface,
    borderWidth: 1,
    borderColor: active ? colors.tint : colors.border,
  });

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 14 }}>
        <Text variant="h1">Search</Text>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search services or artisans…" autoFocus={!params.category} />
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 14 }}>
        <Pressable onPress={() => setCategory(null)} style={chip(!category)}>
          <Text variant="caption" style={{ color: !category ? '#FFF' : colors.fg, fontFamily: 'Inter_500Medium' }}>
            All
          </Text>
        </Pressable>
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <Pressable key={c.id} onPress={() => setCategory(active ? null : c.id)} style={chip(active)}>
              <Text variant="caption" style={{ color: active ? '#FFF' : colors.fg, fontFamily: 'Inter_500Medium' }}>
                {c.name[locale]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sort row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 8 }}>
        <Text variant="caption" tone="muted">
          Sort:
        </Text>
        {(['popular', 'price', 'name'] as SortKey[]).map((k) => (
          <Pressable key={k} onPress={() => setSort(k)}>
            <Text variant="caption" tone={sort === k ? 'primary' : 'muted'} style={{ fontFamily: sort === k ? 'Inter_600SemiBold' : 'Inter_400Regular', textTransform: 'capitalize' }}>
              {k}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Text variant="caption" tone="muted">
          {results.length} results
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 12 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)
        ) : results.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <EmptyState icon="search" title="No results" description="Try a different search term or category filter." />
          </View>
        ) : (
          results.map((s) => (
            <Animated.View key={s.id} entering={FadeIn.duration(300)}>
              <ServiceCard service={s} locale={locale} onPress={() => router.push(`/(shared)/service/${s.id}`)} />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
