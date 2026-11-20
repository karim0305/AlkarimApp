import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@/hooks/useQuery';
import { getShop } from '@/services/shops';
import { listProducts } from '@/services/products';
import { ProductGrid } from '@/components/ProductGrid';
import { Card, Empty, ErrorBox, Loading, Txt } from '@/components/ui';
import { View } from 'react-native';

export default function StorePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shop = useQuery(() => getShop(id), [id]);
  const prods = useQuery(() => listProducts({ shop: id }), [id]);
  if (shop.loading || prods.loading) return <Loading full />;
  if (shop.error || prods.error) return <ErrorBox message={(shop.error ?? prods.error)!} retry={() => { shop.reload(); prods.reload(); }} />;
  if (!shop.data || shop.data.status !== 'active') return <Empty title="This shop isn’t available" text="It may be waiting for approval or temporarily switched off." />;
  const s = shop.data;
  return (
    <ProductGrid data={prods.data ?? []} onRefresh={() => { shop.reload(); prods.refresh(); }} refreshing={prods.refreshing}
      header={<View style={{ padding: 16 }}><Card><Txt v="h2">{s.name}</Txt><Txt v="small">{s.city}</Txt>{s.description ? <Txt>{s.description}</Txt> : null}</Card></View>}
      empty={<Empty title="No products yet" text="This shop hasn’t listed anything. Check back soon." />} />
  );
}
