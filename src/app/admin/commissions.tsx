import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@/hooks/useQuery';
import { useConfirm, useToast } from '@/context/toast';
import { usePlatform } from '@/context/platform';
import { listAllOrders } from '@/services/orders';
import { listShops } from '@/services/shops';
import { listAllPayments, receivePayment } from '@/services/payments';
import { summarize } from '@/services/calc';
import { Badge, Button, Card, Chip, ChipRow, Empty, ErrorBox, Field, Grid, KV, Loading, Row, Screen, Select, StatCard, Txt } from '@/components/ui';
import { C } from '@/lib/theme';
import { dayLabel, daysBack, localDay, rs, shortDate, todayStr } from '@/lib/format';
import type { Order } from '@/lib/types';

function byShop(orders: Order[]) {
  const m = new Map<string, { id: string; name: string; count: number; sales: number; commission: number; earnings: number }>();
  for (const o of orders) {
    if (o.status !== 'delivered') continue;
    const e = m.get(o.shop_id) ?? { id: o.shop_id, name: o.shop_name, count: 0, sales: 0, commission: 0, earnings: 0 };
    e.count++; e.sales += o.subtotal; e.commission += o.commission_amount; e.earnings += o.shop_earning; m.set(o.shop_id, e);
  }
  return [...m.values()].sort((a, b) => b.commission - a.commission);
}
function ShopList({ rows, empty }: { rows: ReturnType<typeof byShop>; empty: string }) {
  const t = rows.reduce((a, r) => ({ count: a.count + r.count, sales: a.sales + r.sales, commission: a.commission + r.commission, earnings: a.earnings + r.earnings }), { count: 0, sales: 0, commission: 0, earnings: 0 });
  if (!rows.length) return <Txt v="small">{empty}</Txt>;
  return <View style={{ gap: 10 }}>
    {rows.map((r) => <View key={r.id} style={{ gap: 2 }}><Txt bold>{r.name}</Txt><KV k={`${r.count} delivered · sales`} v={rs(r.sales)} /><KV k="Commission" v={rs(r.commission)} color={C.crimson} /><KV k="Shop earnings" v={rs(r.earnings)} color={C.green} /></View>)}
    <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, gap: 2 }}><KV k="Total commission" v={rs(t.commission)} bold color={C.crimson} /><KV k="Total sales" v={rs(t.sales)} bold /></View>
  </View>;
}

const isDay = (d: string) => d === '' || /^\d{4}-\d{2}-\d{2}$/.test(d);

export default function Commissions() {
  const { pct } = usePlatform(); const confirm = useConfirm(); const toast = useToast();
  const o = useQuery(listAllOrders); const shops = useQuery(() => listShops()); const pay = useQuery(listAllPayments);
  const [from, setFrom] = useState(daysBack(30)); const [to, setTo] = useState(todayStr()); const [shop, setShop] = useState('');
  const orders = o.data ?? [];
  const inRange = useMemo(() => orders.filter((x) => { if (x.status !== 'delivered') return false; const d = localDay(x.delivered_at ?? x.created_at); return (!from || d >= from) && (!to || d <= to); }), [orders, from, to]);
  if (o.loading || shops.loading || pay.loading) return <Loading full />;
  if (o.error || pay.error) return <ErrorBox message={(o.error ?? pay.error)!} retry={() => { o.reload(); pay.reload(); }} />;

  const t = summarize(orders); const bad = !isDay(from) || !isDay(to) || (!!from && !!to && from > to); const rt = summarize(inRange);
  const all = pay.data ?? []; const rows = all.filter((p) => !shop || p.shop_id === shop);
  const sum = (s: 'received' | 'not_received') => rows.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  const owed = shop ? summarize(orders.filter((x) => x.shop_id === shop)).commission : null;
  const receive = async (id: string, name: string, amount: number) => {
    if (!(await confirm({ title: `Mark ${rs(amount)} from ${name} as received?`, message: 'This is final. After it is received, neither you nor the shop can change or undo it.', confirmLabel: 'Mark received' }))) return;
    try { await receivePayment(id); toast(`${rs(amount)} from ${name} marked received.`); } catch (x) { toast((x as Error).message, 'error'); }
  };
  const presets: [string, () => void][] = [['7 days', () => { setFrom(daysBack(7)); setTo(todayStr()); }], ['30 days', () => { setFrom(daysBack(30)); setTo(todayStr()); }], ['This month', () => { const d = new Date(); setFrom(localDay(new Date(d.getFullYear(), d.getMonth(), 1))); setTo(localDay(d)); }], ['All time', () => { setFrom(''); setTo(''); }]];

  return (
    <Screen onRefresh={() => { o.refresh(); pay.reload(); }} refreshing={o.refreshing}>
      <Grid>
        <StatCard label="Delivered sales" value={rs(t.sales)} />
        <StatCard label={`Commission (${pct})`} value={rs(t.commission)} tone={C.crimson} />
        <StatCard label="Paid out to shops" value={rs(t.earnings)} tone={C.green} />
      </Grid>
      <Card><Txt v="h3">Commission by shop (all time)</Txt><ShopList rows={byShop(orders)} empty="Commission is recorded when orders are delivered." /></Card>
      <Card>
        <Txt v="h3">Commission by shop (date range)</Txt><Txt v="small">Counts orders by the day they were delivered.</Txt>
        <ChipRow>{presets.map(([l, fn]) => <Chip key={l} label={l} onPress={fn} />)}</ChipRow>
        <Row style={{ gap: 10 }}><View style={{ flex: 1 }}><Field label="From" value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" /></View><View style={{ flex: 1 }}><Field label="To" value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" /></View></Row>
        {bad ? <Txt color={C.crimson} v="small">Use dates like 2026-10-25, with “From” before “To”.</Txt> : <>
          <Txt v="small">{from || to ? `${from ? dayLabel(from) : 'Start'} to ${to ? dayLabel(to) : 'today'}` : 'All time'}: <Txt v="small" bold>{rt.delivered}</Txt> delivered orders, <Txt v="small" bold>{rs(rt.sales)}</Txt> sales, <Txt v="small" bold color={C.crimson}>{rs(rt.commission)}</Txt> commission.</Txt>
          <ShopList rows={byShop(inRange)} empty="No orders were delivered in this date range." /></>}
      </Card>

      <Card>
        <Txt v="h3">Commission payments from shops</Txt><Txt v="small">Mark a payment received once the money has reached you.</Txt>
        <Select label="Shop" value={shop} onChange={setShop} options={[{ value: '', label: 'All shops' }, ...(shops.data ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
        <KV k="Total submitted" v={rs(sum('received') + sum('not_received'))} bold /><KV k="Received" v={rs(sum('received'))} color={C.green} /><KV k="Not received" v={rs(sum('not_received'))} color={C.amber} />
        {owed !== null && <KV k="Commission owed / balance" v={`${rs(owed)} / ${rs(Math.max(0, owed - sum('received')))}`} color={C.crimson} />}
      </Card>
      {rows.length === 0 ? <Empty title="No payments" text={shop ? 'This shop has not submitted any payment.' : 'Payments submitted by shops appear here.'} /> : rows.map((p) => (
        <Card key={p.id}>
          <Row style={{ justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Txt v="h3">{rs(p.amount)}</Txt><Txt v="small">{p.shop_name}</Txt></View><Badge status={p.status} /></Row>
          <Txt v="small">Paid on {dayLabel(p.paid_on)} · submitted {shortDate(p.created_at)}{p.received_at ? ` · received ${shortDate(p.received_at)}` : ''}</Txt>
          {p.comment ? <Txt>{p.comment}</Txt> : null}
          {p.status === 'not_received' ? <Button title="Receive" small onPress={() => receive(p.id, p.shop_name, p.amount)} /> : <Txt v="tiny">Closed</Txt>}
        </Card>
      ))}
    </Screen>
  );
}
