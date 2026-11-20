import React, { useMemo, useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { listAllOrders } from '@/services/orders';
import { AttentionPanel, OrderDetailsSheet, OrderRow } from '@/components/shared';
import { Chip, ChipRow, Empty, ErrorBox, Field, Loading, Screen } from '@/components/ui';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';

/** The admin sees every order and is the only one who can REFER a pending order to its shop. */
export default function AdminOrders() {
  const q = useQuery(listAllOrders);
  const [tab, setTab] = useState<'all' | OrderStatus>('all'); const [search, setSearch] = useState(''); const [open, setOpen] = useState<Order | null>(null);
  const list = q.data ?? [];
  const rows = useMemo(() => list.filter((o) => (tab === 'all' || o.status === tab) && (!search || `${o.order_no} ${o.customer_name} ${o.shop_name} ${o.phone}`.toLowerCase().includes(search.toLowerCase()))), [list, tab, search]);
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
  return (
    <>
      <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
        <AttentionPanel orders={list} onOpen={setOpen} />
        <Field value={search} onChangeText={setSearch} placeholder="Search order, customer, phone or shop" autoCapitalize="none" />
        <ChipRow>{(['all', ...ORDER_STATUSES] as const).map((s) => <Chip key={s} label={s === 'all' ? `All ${list.length}` : `${s[0].toUpperCase()}${s.slice(1)} ${count(s)}`} selected={tab === s} onPress={() => setTab(s)} />)}</ChipRow>
        {rows.length === 0 ? <Empty title="No orders here" text="Orders matching this filter will appear here." /> : rows.map((o) => <OrderRow key={o.id} o={o} showShop onPress={() => setOpen(o)} />)}
      </Screen>
      <OrderDetailsSheet order={open ? (list.find((x) => x.id === open.id) ?? open) : null} role="admin" onClose={() => setOpen(null)} />
    </>
  );
}
