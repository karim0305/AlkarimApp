import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@/hooks/useQuery';
import { useMyShop } from '@/hooks/useMyShop';
import { useConfirm, useToast } from '@/context/toast';
import { deleteProduct, listShopProducts } from '@/services/products';
import { Button, Card, Empty, ErrorBox, Loading, ProductImage, Row, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';
import { rs } from '@/lib/format';

export default function ShopProducts() {
  const { shopId } = useMyShop(); const router = useRouter(); const confirm = useConfirm(); const toast = useToast();
  const q = useQuery(() => listShopProducts(shopId), [shopId]);
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const del = async (id: string, name: string) => {
    if (!(await confirm({ title: 'Delete this product?', message: `“${name}” will be removed from the marketplace. Past orders keep their details.`, confirmLabel: 'Delete product', danger: true }))) return;
    try { await deleteProduct(id); toast('Product deleted.', 'info'); } catch (x) { toast((x as Error).message, 'error'); }
  };
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      <Button title="Add product" icon="add-circle-outline" onPress={() => router.push('/shop-product/new')} />
      {(q.data ?? []).length === 0 ? <Empty title="No products yet" text="Add your first product to start receiving orders." /> : (q.data ?? []).map((p) => (
        <Card key={p.id}>
          <Pressable onPress={() => router.push(`/shop-product/${p.id}`)}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ width: 64, borderRadius: 10, overflow: 'hidden' }}>{p.images[0] ? <Image source={{ uri: p.images[0] }} style={{ width: 64, height: 80 }} /> : <ProductImage colors={p.colors} />}</View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="h3" numberOfLines={2}>{p.name}</Txt>
                <Txt v="small" style={{ fontFamily: 'monospace' }}>{p.code} · {p.category_name}</Txt>
                <Txt bold>{rs(p.final_price)}{p.discount_percent > 0 ? <Txt v="small" color={C.crimson}>  -{p.discount_percent}%</Txt> : null}</Txt>
                <Txt v="small" color={p.stock <= 5 ? C.crimson : C.muted} bold={p.stock <= 5}>Stock {p.stock} · Sold {p.sold}</Txt>
              </View>
            </Row>
          </Pressable>
          <Row style={{ gap: 8 }}><Button title="Edit" variant="outline" small icon="create-outline" style={{ flex: 1 }} onPress={() => router.push(`/shop-product/${p.id}`)} /><Button title="Delete" variant="outline" small icon="trash-outline" style={{ flex: 1 }} onPress={() => del(p.id, p.name)} /></Row>
        </Card>
      ))}
    </Screen>
  );
}
