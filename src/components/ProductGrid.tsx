import React, { type ReactElement } from 'react';
import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { ProductCard } from './shared';
import { C } from '@/lib/theme';
import type { ProductView } from '@/lib/types';

/** Two-column product list with an optional header (filters, shop banner…). */
export function ProductGrid({ data, header, empty, onRefresh, refreshing }: { data: ProductView[]; header?: ReactElement; empty?: ReactElement; onRefresh?: () => void; refreshing?: boolean }) {
  const { width } = useWindowDimensions();
  const w = (width - 16 * 2 - 10) / 2;
  return (
    <FlatList data={data} keyExtractor={(p) => p.id} numColumns={2} style={{ backgroundColor: C.surface }} keyboardShouldPersistTaps="handled"
      columnWrapperStyle={{ gap: 10, paddingHorizontal: 16 }} contentContainerStyle={{ gap: 10, paddingBottom: 28 }}
      ListHeaderComponent={header} ListEmptyComponent={empty} renderItem={({ item }) => <ProductCard p={item} style={{ width: w }} />}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.indigo} /> : undefined} />
  );
}
