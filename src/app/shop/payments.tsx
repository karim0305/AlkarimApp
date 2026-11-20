import React, { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@/hooks/useQuery';
import { useMyShop } from '@/hooks/useMyShop';
import { useToast } from '@/context/toast';
import { listShopOrders } from '@/services/orders';
import { listShopPayments, submitPayment, updatePayment } from '@/services/payments';
import { summarize } from '@/services/calc';
import { Badge, Button, Card, Empty, ErrorBox, Field, Grid, KV, Loading, Row, Screen, StatCard, Txt } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { C } from '@/lib/theme';
import { dayLabel, daysBack, rs, shortDate, todayStr } from '@/lib/format';
import type { PaymentView } from '@/lib/types';

const isDay = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(`${d}T00:00:00`).getTime());

/** The shop tells the admin it paid its commission. It can edit a payment until the admin marks it received. */
export default function ShopPayments() {
  const { shopId } = useMyShop(); const toast = useToast();
  const pay = useQuery(() => listShopPayments(shopId), [shopId]); const ord = useQuery(() => listShopOrders(shopId), [shopId]);
  const [editing, setEditing] = useState<PaymentView | null>(null);
  const [date, setDate] = useState(todayStr()); const [amount, setAmount] = useState(''); const [comment, setComment] = useState(''); const [busy, setBusy] = useState(false);

  if (pay.loading || ord.loading) return <Loading full />;
  if (pay.error || ord.error) return <ErrorBox message={(pay.error ?? ord.error)!} retry={() => { pay.reload(); ord.reload(); }} />;
  const list = pay.data ?? [];
  const sum = (s: 'received' | 'not_received') => list.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  const owed = summarize(ord.data ?? []).commission; const received = sum('received'); const waiting = sum('not_received');
  const reset = () => { setEditing(null); setDate(todayStr()); setAmount(''); setComment(''); };
  const startEdit = (p: PaymentView) => { setEditing(p); setDate(p.paid_on); setAmount(String(p.amount)); setComment(p.comment); };
  const submit = async () => {
    const n = Number(amount);
    if (!(n > 0)) { toast('Enter the amount you paid.', 'error'); return; }
    if (!isDay(date) || date > todayStr()) { toast('Enter the date as YYYY-MM-DD, not in the future.', 'error'); return; }
    setBusy(true);
    try {
      const input = { paid_on: date, amount: n, comment: comment.trim() };
      if (editing) await updatePayment(editing.id, input); else await submitPayment(shopId, input);
      toast(editing ? 'Payment updated.' : 'Payment submitted. The admin will confirm when it is received.'); reset();
    } catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  return (
    <Screen onRefresh={() => { pay.refresh(); ord.reload(); }} refreshing={pay.refreshing}>
      <Grid>
        <StatCard label="Commission on delivered orders" value={rs(owed)} tone={C.crimson} />
        <StatCard label={`Received by ${BRAND.first}`} value={rs(received)} hint="Confirmed by the admin" tone={C.green} />
        <StatCard label="Balance to pay" value={rs(Math.max(0, owed - received))} hint={waiting ? `${rs(waiting)} submitted, waiting` : undefined} tone={C.amber} />
      </Grid>
      <Card>
        <Txt v="h3">{editing ? 'Edit payment' : 'Submit a commission payment'}</Txt>
        <Txt v="small">Paid your commission? Enter the date, the amount and a note (bank, JazzCash, Easypaisa, reference number). You can edit it until the admin marks it received.</Txt>
        <Field label="Payment date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" hint="Format: 2026-10-25" />
        <Row style={{ gap: 8 }}><Button title="Today" variant="outline" small onPress={() => setDate(todayStr())} /><Button title="Yesterday" variant="outline" small onPress={() => setDate(daysBack(1))} /></Row>
        <Field label="Amount (Rs.)" value={amount} onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ''))} keyboardType="numeric" placeholder="e.g. 1500" />
        <Field label="Comment" value={comment} onChangeText={setComment} multiline maxLength={500} placeholder="e.g. Bank transfer, ref 88421" />
        <Row style={{ gap: 8 }}><Button title={editing ? 'Save changes' : 'Submit payment'} loading={busy} onPress={submit} style={{ flex: 1 }} />{editing && <Button title="Cancel" variant="outline" onPress={reset} />}</Row>
      </Card>
      <Txt v="h3">Your submitted payments</Txt>
      {list.length === 0 ? <Empty title="No payments yet" text="Payments you submit appear here with their status." /> : list.map((p) => (
        <Card key={p.id}>
          <Row style={{ justifyContent: 'space-between' }}><Txt v="h3">{rs(p.amount)}</Txt><Badge status={p.status} /></Row>
          <Txt v="small">Paid on {dayLabel(p.paid_on)} · submitted {shortDate(p.created_at)}{p.received_at ? ` · received ${shortDate(p.received_at)}` : ''}</Txt>
          {p.comment ? <Txt>{p.comment}</Txt> : null}
          {p.status === 'not_received' ? <Button title="Edit" variant="outline" small icon="create-outline" onPress={() => startEdit(p)} /> : <Txt v="tiny">Locked after the admin received it</Txt>}
        </Card>
      ))}
      {list.length > 0 && <Card><KV k="Total submitted" v={rs(received + waiting)} bold /><KV k="Received" v={rs(received)} color={C.green} /><KV k="Not received" v={rs(waiting)} color={C.amber} /></Card>}
      <View style={{ height: 8 }} />
    </Screen>
  );
}
