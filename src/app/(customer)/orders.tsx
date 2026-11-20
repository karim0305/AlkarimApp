import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useConfirm, useToast } from '@/context/toast';
import { useQuery } from '@/hooks/useQuery';
import { confirmReceipt, disputeCancellation, listCustomerOrders, updateOrderStatus } from '@/services/orders';
import { listMyReviews } from '@/services/reviews';
import { ReviewForm } from '@/components/shared';
import { Badge, Button, Card, Empty, ErrorBox, Field, Loading, Row, Screen, Sheet, Stars, Txt } from '@/components/ui';
import { C } from '@/lib/theme';
import { rs, shortDate } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';

const track: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== 'cancelled');

export default function MyOrders() {
  const { user, ready } = useAuth(); const router = useRouter(); const confirm = useConfirm(); const toast = useToast();
  const q = useQuery(() => (user ? listCustomerOrders(user.id) : Promise.resolve([] as Order[])), [user?.id]);
  const mine = useQuery(() => (user ? listMyReviews(user.id) : Promise.resolve([])), [user?.id]);
  const [reviewing, setReviewing] = useState<{ o: Order; productId: string; name: string } | null>(null);
  const [disputing, setDisputing] = useState<Order | null>(null); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);

  if (!ready) return <Loading full />;
  if (!user) return <Screen><Empty title="Log in to see your orders" text="Your orders and their live status appear here." action={<Button title="Log in" onPress={() => router.push('/login?next=/orders')} />} /></Screen>;
  if (user.role !== 'customer') return <Screen><Empty title="This page is for customers" text="Use your own panel to manage orders." /></Screen>;
  if (q.loading) return <Loading full />;
  if (q.error) return <Screen><ErrorBox message={q.error} retry={q.reload} /></Screen>;
  const list = q.data ?? [];
  const reviewOf = (orderId: string, productId: string) => (mine.data ?? []).find((r) => r.order_id === orderId && r.product_id === productId);

  const cancel = async (o: Order) => {
    if (!(await confirm({ title: `Cancel order ${o.order_no}?`, message: 'The shop will be told and the items go back into stock.', confirmLabel: 'Cancel order', danger: true }))) return;
    try { await updateOrderStatus(o.id, 'cancelled'); toast(`Order ${o.order_no} cancelled.`, 'info'); } catch (x) { toast((x as Error).message, 'error'); }
  };
  const received = async (o: Order) => {
    if (!(await confirm({ title: `Did you receive ${o.order_no}?`, message: 'Only confirm if the items are in your hands and you have paid. This marks the order as delivered.', confirmLabel: 'Yes, I received it' }))) return;
    try { await confirmReceipt(o.id); toast('Thanks! Order marked as delivered. You can now review your items.'); } catch (x) { toast((x as Error).message, 'error'); }
  };
  const sendDispute = async () => {
    if (!disputing) return; setBusy(true);
    try { await disputeCancellation(disputing.id, note.trim()); toast('Reported. We will contact you.'); setDisputing(null); setNote(''); } catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };

  return (
    <>
      <Screen onRefresh={() => { q.refresh(); mine.reload(); }} refreshing={q.refreshing}>
        {list.length === 0 ? <Empty title="No orders yet" text="When you place an order it shows up here with live status." action={<Button title="Browse products" onPress={() => router.push('/browse')} />} /> :
          list.map((o) => {
            const idx = track.indexOf(o.status);
            return (
              <Card key={o.id}>
                <Row style={{ justifyContent: 'space-between' }}><View><Txt v="h3">{o.order_no}</Txt><Txt v="small">{shortDate(o.created_at)} · {o.shop_name}</Txt></View><Badge status={o.status} /></Row>
                {o.items.map((i) => {
                  const rv = reviewOf(o.id, i.product_id);
                  return (
                    <View key={i.product_id + i.size + i.color} style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, gap: 6 }}>
                      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Link href={`/product/${i.product_id}`} asChild><Pressable style={{ flex: 1 }}><Txt>{i.name}</Txt><Txt v="small">{i.size}, {i.color} × {i.quantity}</Txt></Pressable></Link>
                        <Txt bold>{rs(i.unit_price * i.quantity)}</Txt>
                      </Row>
                      {o.status === 'delivered' && (rv
                        ? <Pressable onPress={() => setReviewing({ o, productId: i.product_id, name: i.name })}><Row><Stars value={rv.rating} size={14} /><Txt v="small" color={C.indigo} bold>Edit review</Txt></Row></Pressable>
                        : <Button title="Write a review" variant="outline" small onPress={() => setReviewing({ o, productId: i.product_id, name: i.name })} />)}
                    </View>
                  );
                })}
                {o.status !== 'cancelled' && (
                  <View style={{ flexDirection: 'row', gap: 3 }}>{track.map((s, i) => <View key={s} style={{ flex: 1, alignItems: 'center', gap: 3 }}><View style={{ height: 5, alignSelf: 'stretch', borderRadius: 3, backgroundColor: i <= idx ? C.indigo : '#E2E8F0' }} /><Txt v="tiny" style={{ fontSize: 9, color: i <= idx ? C.indigo : C.faint, fontWeight: i <= idx ? '700' : '400' }}>{s}</Txt></View>)}</View>
                )}
                {o.status === 'cancelled' && (
                  <View style={{ backgroundColor: C.crimson50, borderRadius: 10, padding: 10, gap: 6 }}>
                    <Txt color={C.crimson}>Cancelled by {o.cancelled_by === 'shop' ? 'the shop' : o.cancelled_by === 'admin' ? 'us' : 'you'}{o.cancel_reason ? `: ${o.cancel_reason}` : ''}.</Txt>
                    {o.cancelled_by === 'shop' && (o.disputed_at ? <Txt bold color={C.crimson}>You reported this. We will contact you.</Txt> : <Pressable onPress={() => setDisputing(o)}><Txt bold color={C.crimson} style={{ textDecorationLine: 'underline' }}>That’s not true. Report it</Txt></Pressable>)}
                  </View>
                )}
                <Txt>Pay on delivery: <Txt bold>{rs(o.subtotal + o.delivery_charge)}</Txt> <Txt v="small">({o.delivery_charge ? `incl. ${rs(o.delivery_charge)} delivery` : 'free delivery'})</Txt></Txt>
                <Row style={{ gap: 8 }}>
                  {['confirmed', 'processing', 'shipped'].includes(o.status) && <Button title="I received this order" variant="gold" small onPress={() => received(o)} />}
                  {['pending', 'referred', 'confirmed'].includes(o.status) && <Button title="Cancel order" variant="outline" small onPress={() => cancel(o)} />}
                </Row>
              </Card>
            );
          })}
      </Screen>
      <Sheet visible={!!reviewing} onClose={() => setReviewing(null)} title="Your review">
        {reviewing && user && <ReviewForm userId={user.id} orderId={reviewing.o.id} productId={reviewing.productId} productName={reviewing.name} existing={reviewOf(reviewing.o.id, reviewing.productId)} onDone={() => { setReviewing(null); mine.reload(); }} />}
      </Sheet>
      <Sheet visible={!!disputing} onClose={() => setDisputing(null)} title="Report this cancellation">
        <Txt v="small">Tell us what really happened, e.g. nobody called me or came to my address.</Txt>
        <Field value={note} onChangeText={setNote} multiline maxLength={500} placeholder="What happened?" />
        <Button title="Report to us" variant="danger" loading={busy} onPress={sendDispute} />
      </Sheet>
    </>
  );
}
