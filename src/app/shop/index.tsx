import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@/hooks/useQuery';
import { useMyShop } from '@/hooks/useMyShop';
import { usePlatform } from '@/context/platform';
import { listShopOrders } from '@/services/orders';
import { listShopProducts } from '@/services/products';
import { summarize } from '@/services/calc';
import { OrderDetailsSheet, OrderRow } from '@/components/shared';
import { Button, ErrorBox, Grid, Loading, Screen, SectionTitle, StatCard, Txt } from '@/components/ui';
import { C } from '@/lib/theme';
import { rs } from '@/lib/format';
import type { Order } from '@/lib/types';

/** Minimum statistics: the numbers a shop owner needs every day. */
export default function ShopHome() {
  const { shopId } = useMyShop(); const router = useRouter(); const { pct } = usePlatform();
  const o = useQuery(() => listShopOrders(shopId), [shopId]); const p = useQuery(() => listShopProducts(shopId), [shopId]);
  const [open, setOpen] = useState<Order | null>(null);
  if (o.loading || p.loading) return <Loading full />;
  if (o.error || p.error) return <ErrorBox message={(o.error ?? p.error)!} retry={() => { o.reload(); p.reload(); }} />;
  const s = summarize(o.data ?? []);
  return (
    <>
      <Screen onRefresh={() => { o.refresh(); p.reload(); }} refreshing={o.refreshing}>
        <Grid>
          <StatCard label="Pending orders" value={s.pending} hint="Referred, not yet delivered" tone={C.amber} />
          <StatCard label="Delivered orders" value={s.delivered} tone={C.green} />
          <StatCard label="Total sales" value={rs(s.sales)} hint="Delivered orders" />
          <StatCard label="Net earnings" value={rs(s.earnings)} hint={`After ${pct} commission`} tone={C.green} />
          <StatCard label="Commission" value={rs(s.commission)} tone={C.crimson} />
          <StatCard label="Products" value={(p.data ?? []).length} />
        </Grid>
        <Button title="Add a product" icon="add-circle-outline" onPress={() => router.push('/shop-product/new')} />
        <SectionTitle title="Recent orders" action="See all" onAction={() => router.push('/shop/orders')} />
        {(o.data ?? []).length === 0 ? <Txt v="small">Orders the admin refers to your shop will appear here.</Txt> : (o.data ?? []).slice(0, 5).map((x) => <OrderRow key={x.id} o={x} onPress={() => setOpen(x)} />)}
      </Screen>
      <OrderDetailsSheet order={open ? ((o.data ?? []).find((x) => x.id === open.id) ?? open) : null} role="shop" onClose={() => setOpen(null)} />
    </>
  );
}
