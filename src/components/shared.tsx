import React, { useState } from 'react';
import { Image, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, Field, KV, ProductImage, Row, Select, Sheet, StarInput, Stars, Txt } from './ui';
import { useCart } from '@/context/cart';
import { useConfirm, useToast } from '@/context/toast';
import { usePlatform } from '@/context/platform';
import { C } from '@/lib/theme';
import { COLOR_HEX } from '@/lib/colors';
import { BRAND } from '@/lib/brand';
import { attentionFlags, FOLLOW_UP_DAYS } from '@/lib/attention';
import { callPhone, openWhatsApp } from '@/lib/links';
import { rs, shortDate } from '@/lib/format';
import { markChecked, updateOrderStatus } from '@/services/orders';
import { nextStatuses } from '@/services/calc';
import { submitReview } from '@/services/reviews';
import type { Order, OrderStatus, ProductView, ReviewView } from '@/lib/types';

/* ---------- logo ---------- */
export function BrandLogo({ light, small }: { light?: boolean; small?: boolean }) {
  const h = small ? 34 : 44;
  return (
    <Row style={{ gap: 8 }}>
      <Image source={require('../../assets/logo-mark.png')} style={{ height: h, width: h * 1.28 }} resizeMode="contain" accessibilityLabel={BRAND.name} />
      <View>
        <Text style={{ fontFamily: 'serif', fontWeight: '800', fontSize: small ? 15 : 18, letterSpacing: 1, color: light ? '#E9C873' : C.brandGold }}>{BRAND.first.toUpperCase()}</Text>
        <Text style={{ fontFamily: 'serif', fontWeight: '700', fontSize: small ? 9 : 10.5, letterSpacing: 4, color: light ? '#CDAA55' : '#A8842F', marginTop: 1 }}>{BRAND.second.toUpperCase()}</Text>
      </View>
    </Row>
  );
}

/* ---------- product card ---------- */
export function ProductCard({ p, style }: { p: ProductView; style?: StyleProp<ViewStyle> }) {
  const router = useRouter(); const cart = useCart(); const toast = useToast();
  const out = p.stock === 0;
  const quickAdd = () => {
    if (!cart.add({ product_id: p.id, size: p.sizes[0], color: p.colors[0], quantity: 1 })) return;
    toast(`${p.name} added to your cart (size ${p.sizes[0]}, ${p.colors[0]}).`);
  };
  return (
    <View style={[{ backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }, style]}>
      <Pressable onPress={() => router.push(`/product/${p.id}`)} accessibilityRole="button" accessibilityLabel={p.name}>
        <View>
          <ProductImage uri={p.images[0]} colors={p.colors} />
          {p.discount_percent > 0 && <View style={{ position: 'absolute', left: 8, top: 8, backgroundColor: C.crimson, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>-{p.discount_percent}%</Text></View>}
          {out && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,22,48,0.8)', paddingVertical: 4 }}><Text style={{ color: '#fff', textAlign: 'center', fontSize: 11, fontWeight: '700' }}>Sold out</Text></View>}
        </View>
        <View style={{ padding: 10, gap: 3 }}>
          <Txt v="tiny" color={C.crimson} bold numberOfLines={1}>{p.shop_name}</Txt>
          <Txt numberOfLines={2} style={{ fontWeight: '600', minHeight: 40 }}>{p.name}</Txt>
          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.indigoDark }}>{rs(p.final_price)}</Text>
            {p.discount_percent > 0 && <Text style={{ fontSize: 12, color: C.faint, textDecorationLine: 'line-through' }}>{rs(p.price)}</Text>}
          </Row>
          <Txt v="tiny" numberOfLines={1}>Sizes: {p.sizes.join(', ')}</Txt>
          <Row style={{ gap: 5 }}>{p.colors.slice(0, 6).map((c) => <View key={c} style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: COLOR_HEX[c] ?? '#999', borderWidth: 1, borderColor: '#CBD5E1' }} />)}</Row>
        </View>
      </Pressable>
      <View style={{ padding: 10, paddingTop: 0 }}><Button title={out ? 'Sold out' : 'Add to cart'} variant="outline" small icon="bag-add-outline" disabled={out} onPress={quickAdd} /></View>
    </View>
  );
}

/* ---------- reviews ---------- */
export const averageRating = (r: { rating: number }[]) => (r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0);

export function ProductReviews({ reviews }: { reviews: ReviewView[] }) {
  const avg = averageRating(reviews);
  return (
    <View style={{ gap: 10 }}>
      <Txt v="h2">Customer reviews</Txt>
      {reviews.length === 0 ? <Card><Txt v="small">No reviews yet. Customers can review this product after their order is delivered.</Txt></Card> : (
        <>
          <Card><Row style={{ gap: 12 }}><Text style={{ fontSize: 34, fontWeight: '800', color: C.indigoDark }}>{avg.toFixed(1)}</Text><View style={{ gap: 2 }}><Stars value={avg} size={18} /><Txt v="small">{reviews.length} review{reviews.length > 1 ? 's' : ''}</Txt></View></Row></Card>
          {reviews.map((r) => (
            <Card key={r.id} style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}><Row><Stars value={r.rating} /><Txt bold>{r.customer_name}</Txt></Row><Txt v="tiny">{shortDate(r.created_at)}</Txt></Row>
              {r.comment ? <Txt>{r.comment}</Txt> : null}
              <Txt v="tiny">Verified purchase</Txt>
            </Card>
          ))}
        </>
      )}
    </View>
  );
}

export function ReviewForm({ userId, orderId, productId, productName, existing, onDone }: { userId: string; orderId: string; productId: string; productName: string; existing?: { rating: number; comment: string }; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(existing?.rating ?? 0); const [comment, setComment] = useState(existing?.comment ?? ''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!rating) { toast('Choose a star rating first.', 'error'); return; }
    setBusy(true);
    try { await submitReview(userId, { order_id: orderId, product_id: productId, rating, comment: comment.trim() }); toast('Thank you for your review!'); onDone(); }
    catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  return (
    <View style={{ gap: 14 }}>
      <Txt v="small">How was “{productName}”?</Txt>
      <StarInput value={rating} onChange={setRating} />
      <Field label="Your review (optional)" value={comment} onChangeText={setComment} multiline maxLength={600} placeholder="Fabric, fit, delivery…" autoCapitalize="sentences" />
      <Button title={existing ? 'Update review' : 'Submit review'} onPress={submit} loading={busy} />
    </View>
  );
}

/* ---------- orders (shop + admin) ---------- */
const SHOP_REASONS = ['Customer refused the delivery', 'Customer not reachable', 'Wrong or incomplete address', 'Out of stock', 'Other'];
const ADMIN_REASONS = ['Fake or duplicate order', 'Customer asked to cancel', 'Shop could not fulfil it', 'Other'];

export function OrderRow({ o, showShop, onPress }: { o: Order; showShop?: boolean; onPress: () => void }) {
  const qty = o.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Card onPress={onPress} style={{ gap: 6 }}>
      <Row style={{ justifyContent: 'space-between' }}><Txt v="h3">{o.order_no}</Txt><Badge status={o.status} /></Row>
      <Txt>{o.customer_name} <Txt v="small">· {o.city}</Txt></Txt>
      <Txt v="small" numberOfLines={1}>{o.items[0]?.name}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ''} · Qty {qty}</Txt>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="small">{showShop ? `${o.shop_name} · ` : ''}{shortDate(o.created_at)}</Txt>
        <Txt bold>{rs(o.subtotal + o.delivery_charge)}</Txt>
      </Row>
    </Card>
  );
}

/**
 * Everything needed to deliver: who, where, what, how much cash. Admin can REFER a pending order (or cancel);
 * the shop confirms and moves referred orders forward. Only the admin ever sees "Refer".
 */
export function OrderDetailsSheet({ order: o, role, onClose }: { order: Order | null; role: 'admin' | 'shop'; onClose: () => void }) {
  const toast = useToast(); const confirm = useConfirm(); const { rate, pct } = usePlatform();
  const [cancelling, setCancelling] = useState(false); const [reason, setReason] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  if (!o) return null;
  const next = nextStatuses(o.status, role);
  const flags = attentionFlags(o);
  const reasons = role === 'admin' ? ADMIN_REASONS : SHOP_REASONS;
  const fee = Math.round(o.subtotal * rate);

  const close = () => { setCancelling(false); setReason(''); setNote(''); onClose(); };
  const move = async (s: OrderStatus) => {
    if (s === 'cancelled') { setCancelling(true); setReason(reasons[0]); return; }
    const ok = await confirm({
      title: s === 'referred' ? `Refer ${o.order_no} to ${o.shop_name}?` : `Mark ${o.order_no} as ${s}?`,
      message: s === 'referred' ? 'The order is sent to the shop with the customer’s address and phone. Only the admin can refer orders.'
        : s === 'delivered' ? `Only mark this delivered if the customer received it. It records ${rs(fee)} commission (${pct}) and ${rs(o.subtotal - fee)} for the shop.` : 'The customer will see the new status straight away.',
      confirmLabel: s === 'referred' ? 'Refer to shop' : `Mark ${s}`,
    });
    if (!ok) return;
    setBusy(true);
    try { await updateOrderStatus(o.id, s, { by: role }); toast(s === 'referred' ? `${o.order_no} referred to ${o.shop_name}.` : `${o.order_no} is now ${s}.`); close(); }
    catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  const doCancel = async () => {
    const text = reason === 'Other' ? note.trim() : `${reason}${note.trim() ? `: ${note.trim()}` : ''}`;
    if (text.length < 3) { toast('Please write the reason.', 'error'); return; }
    setBusy(true);
    try { await updateOrderStatus(o.id, 'cancelled', { reason: text, by: role }); toast(`${o.order_no} cancelled.`); close(); }
    catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };

  return (
    <Sheet visible onClose={close} title={`${o.order_no}`}>
      <Row style={{ justifyContent: 'space-between' }}><Txt v="small">Placed {shortDate(o.created_at)}{role === 'admin' ? ` · ${o.shop_name}` : ''}</Txt><Badge status={o.status} /></Row>
      {flags.length > 0 && <View style={{ backgroundColor: C.crimson50, borderRadius: 10, padding: 10, gap: 2 }}>{flags.map((f) => <Txt key={f.kind} v="small" color={C.crimson}>⚠ {f.label}</Txt>)}</View>}

      <Card style={{ gap: 6 }}>
        <Txt v="h3">Customer and delivery address</Txt>
        <Txt bold>{o.customer_name}</Txt>
        <Txt>{o.phone}</Txt>
        <Row style={{ gap: 8 }}><Button title="Call" small variant="outline" icon="call-outline" onPress={() => callPhone(o.phone)} /><Button title="WhatsApp" small variant="outline" icon="logo-whatsapp" onPress={() => openWhatsApp(o.phone)} /></Row>
        <Txt style={{ marginTop: 4 }}>{o.address}{'\n'}{o.city}</Txt>
        {o.notes ? <View style={{ backgroundColor: C.gold50, borderRadius: 8, padding: 8 }}><Txt v="small"><Txt v="small" bold>Customer’s note: </Txt>{o.notes}</Txt></View> : null}
      </Card>

      <Card style={{ gap: 8 }}>
        <Txt v="h3">Items</Txt>
        {o.items.map((i, k) => (
          <View key={k} style={{ gap: 1 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}><Txt style={{ flex: 1 }}>{i.name}</Txt><Txt bold>{rs(i.unit_price * i.quantity)}</Txt></Row>
            <Txt v="tiny">{i.product_code ? `${i.product_code} · ` : ''}{i.size} · {i.color} · Qty {i.quantity}</Txt>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: C.line }} />
        <KV k="Products" v={rs(o.subtotal)} />
        <KV k="Delivery" v={o.delivery_charge ? rs(o.delivery_charge) : 'Free'} />
        <KV k="Cash to collect on delivery" v={rs(o.subtotal + o.delivery_charge)} bold />
        {o.status === 'delivered' && <KV k="Commission / shop earning" v={`${rs(o.commission_amount)} / ${rs(o.shop_earning)}`} color={C.green} />}
      </Card>

      <Card style={{ gap: 3 }}>
        <Txt v="h3">History</Txt>
        <Txt v="small">Placed: {shortDate(o.created_at)}</Txt>
        {o.referred_at && <Txt v="small">Referred to shop: {shortDate(o.referred_at)}</Txt>}
        {o.status !== 'pending' && o.status !== 'referred' && <Txt v="small">Last update: {shortDate(o.status_changed_at)} ({o.status})</Txt>}
        {o.customer_confirmed_at && <Txt v="small">Customer confirmed receipt: {shortDate(o.customer_confirmed_at)}</Txt>}
        {o.status === 'cancelled' && <Txt v="small">Cancelled by {o.cancelled_by ?? 'unknown'}{o.cancel_reason ? `: ${o.cancel_reason}` : ''}</Txt>}
        {o.disputed_at && <Txt v="small" color={C.crimson}>Customer disputed this cancellation{o.dispute_note ? `: “${o.dispute_note}”` : ''}</Txt>}
      </Card>

      {cancelling ? (
        <Card style={{ gap: 10, borderColor: C.crimson }}>
          <Txt v="h3">Cancel this order?</Txt>
          <Txt v="small">Stock goes back and the customer sees the reason.{role === 'shop' ? ' The admin can check cancellations with the customer, so please be accurate.' : ''}</Txt>
          <Select label="Reason" value={reason} onChange={setReason} options={reasons.map((r) => ({ value: r, label: r }))} />
          <Field label={reason === 'Other' ? 'Details' : 'Details (optional)'} value={note} onChangeText={setNote} multiline autoCapitalize="sentences" />
          <Row><Button title="Keep order" variant="outline" onPress={() => setCancelling(false)} style={{ flex: 1 }} /><Button title="Cancel order" variant="danger" onPress={doCancel} loading={busy} style={{ flex: 1 }} /></Row>
        </Card>
      ) : next.length > 0 ? (
        <View style={{ gap: 8 }}>
          {next.filter((s) => s !== 'cancelled').map((s) => <Button key={s} title={s === 'referred' ? 'Refer to shop' : `Mark ${s}`} variant={s === 'referred' ? 'gold' : 'primary'} onPress={() => move(s)} loading={busy} />)}
          {next.includes('cancelled') && <Button title="Cancel order" variant="outline" onPress={() => move('cancelled')} />}
        </View>
      ) : <Txt v="small" center>{role === 'admin' && ['processing', 'shipped'].includes(o.status) ? 'With the shop' : 'This order is closed.'}</Txt>}
    </Sheet>
  );
}

/** Admin only: orders where a shop might not be telling the whole truth about delivery. */
export function AttentionPanel({ orders, onOpen }: { orders: Order[]; onOpen: (o: Order) => void }) {
  const toast = useToast();
  const flagged = orders.map((o) => ({ o, flags: attentionFlags(o) })).filter((x) => x.flags.length);
  const check = async (o: Order) => { try { await markChecked(o.id); toast(`${o.order_no} marked as checked.`, 'info'); } catch (x) { toast((x as Error).message, 'error'); } };
  return (
    <Card style={{ borderColor: C.crimson100, gap: 8 }}>
      <Row><Ionicons name="shield-checkmark-outline" size={20} color={C.crimson} /><Txt v="h3" color={C.crimson}>Delivery checks{flagged.length ? ` (${flagged.length})` : ''}</Txt></Row>
      <Txt v="tiny">Commission is only earned on delivery. Check with the customer: orders with no update for {FOLLOW_UP_DAYS}+ days, orders a shop cancelled, and cancellations the customer disputes.</Txt>
      {flagged.length === 0 ? <Txt v="small" color={C.green}>All clear. Nothing needs a delivery check.</Txt> : flagged.map(({ o, flags }) => (
        <View key={o.id} style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, gap: 4 }}>
          <Pressable onPress={() => onOpen(o)}><Txt bold>{o.order_no} · {o.shop_name} · {rs(o.subtotal)}</Txt></Pressable>
          <Pressable onPress={() => callPhone(o.phone)}><Txt v="small">{o.customer_name} · <Txt v="small" color={C.indigo} bold>{o.phone}</Txt></Txt></Pressable>
          {flags.map((f) => <Txt key={f.kind} v="small" color={C.crimson}>• {f.label}</Txt>)}
          {o.dispute_note ? <Txt v="small" style={{ fontStyle: 'italic' }}>Customer says: “{o.dispute_note}”</Txt> : null}
          <Row><Button title="Details" small variant="outline" onPress={() => onOpen(o)} /><Button title="Mark checked" small onPress={() => check(o)} /></Row>
        </View>
      ))}
    </Card>
  );
}
