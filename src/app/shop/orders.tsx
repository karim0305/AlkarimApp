import React, { useMemo, useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { useMyShop } from '@/hooks/useMyShop';
import { listShopOrders } from '@/services/orders';
import { OrderDetailsSheet, OrderRow } from '@/components/shared';
import { Chip, ChipRow, Empty, ErrorBox, Field, Loading, Screen } from '@/components/ui';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';

export default function ShopOrders() {
  const { shopId } = useMyShop();
  const q = useQuery(() => listShopOrders(shopId), [shopId]);
  const [tab, setTab] = useState<'all' | OrderStatus>('all'); const [search, setSearch] = useState(''); const [open, setOpen] = useState<Order | null>(null);
  const list = q.data ?? [];
  const rows = useMemo(() => list.filter((o) => (tab === 'all' || o.status === tab) && (!search || `${o.order_no} ${o.customer_name} ${o.phone}`.toLowerCase().includes(search.toLowerCase()))), [list, tab, search]);
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
  return (
    <>
      <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
        <Field value={search} onChangeText={setSearch} placeholder="Search order, customer or phone" autoCapitalize="none" />
        <ChipRow>{(['all', ...ORDER_STATUSES.filter((s) => s !== 'pending')] as const).map((s) => <Chip key={s} label={s === 'all' ? `All ${list.length}` : `${s[0].toUpperCase()}${s.slice(1)} ${count(s)}`} selected={tab === s} onPress={() => setTab(s)} />)}</ChipRow>
        {rows.length === 0 ? <Empty title="No orders here" text="Orders the admin refers to your shop will appear here." /> : rows.map((o) => <OrderRow key={o.id} o={o} onPress={() => setOpen(o)} />)}
      </Screen>
      <OrderDetailsSheet order={open ? (list.find((x) => x.id === open.id) ?? open) : null} role="shop" onClose={() => setOpen(null)} />
    </>
  );
}
