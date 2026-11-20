import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useQuery } from '@/hooks/useQuery';
import { useConfirm, useToast } from '@/context/toast';
import { deleteProduct, listAllProducts } from '@/services/products';
import { Button, Card, Empty, ErrorBox, Field, Loading, ProductImage, Row, Screen, Txt } from '@/components/ui';
import { rs } from '@/lib/format';

export default function AdminProducts() {
  const q = useQuery(listAllProducts); const confirm = useConfirm(); const toast = useToast(); const [search, setSearch] = useState('');
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const rows = (q.data ?? []).filter((p) => !search || `${p.name} ${p.code} ${p.shop_name}`.toLowerCase().includes(search.toLowerCase()));
  const del = async (id: string, name: string) => {
    if (!(await confirm({ title: 'Remove this product?', message: `“${name}” will be deleted from the marketplace for everyone.`, confirmLabel: 'Delete product', danger: true }))) return;
    try { await deleteProduct(id); toast('Product deleted.', 'info'); } catch (x) { toast((x as Error).message, 'error'); }
  };
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      <Field value={search} onChangeText={setSearch} placeholder="Search name, code or shop" autoCapitalize="none" />
      {rows.length === 0 ? <Empty title="No products" /> : rows.map((p) => (
        <Card key={p.id}>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 56, borderRadius: 10, overflow: 'hidden' }}>{p.images[0] ? <Image source={{ uri: p.images[0] }} style={{ width: 56, height: 70 }} /> : <ProductImage colors={p.colors} />}</View>
            <View style={{ flex: 1 }}><Txt v="h3" numberOfLines={2}>{p.name}</Txt><Txt v="small">{p.shop_name} · {p.category_name}</Txt><Txt v="small" style={{ fontFamily: 'monospace' }}>{p.code}</Txt><Txt bold>{rs(p.final_price)} · stock {p.stock} · sold {p.sold}</Txt></View>
          </Row>
          <Button title="Delete" variant="outline" small icon="trash-outline" onPress={() => del(p.id, p.name)} />
        </Card>
      ))}
    </Screen>
  );
}
