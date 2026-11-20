import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { useCart } from '@/context/cart';
import { useToast } from '@/context/toast';
import { useQuery } from '@/hooks/useQuery';
import { getProductsByIds } from '@/services/products';
import { placeOrder } from '@/services/orders';
import { CustomerOnlyNotice } from '@/components/CustomerOnly';
import { Button, Card, Empty, Field, KV, Loading, Row, Screen, Select, Txt } from '@/components/ui';
import { calcDelivery } from '@/lib/delivery';
import { CITIES } from '@/lib/colors';
import { rs } from '@/lib/format';
import { C } from '@/lib/theme';
import type { CartLine, ProductView } from '@/lib/types';

export default function Checkout() {
  const { user, ready } = useAuth(); const cart = useCart(); const router = useRouter(); const toast = useToast();
  const q = useQuery(() => getProductsByIds(cart.lines.map((l) => l.product_id)), [cart.lines.length]);
  const [f, setF] = useState({ full_name: '', phone: '', address: '', city: 'Lahore', notes: '' });
  const [err, setErr] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setF((x) => ({ ...x, full_name: x.full_name || user.name, phone: x.phone || (user.phone ?? '') })); }, [user]);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  if (!ready) return <Loading full />;
  if (user && user.role !== 'customer') return <Screen><CustomerOnlyNotice role={user.role} next="/checkout" /></Screen>;
  if (!user) return <Screen><Empty title="Log in to place your order" text="We need an account so you can track this order afterwards." action={<Button title="Log in or register" onPress={() => router.push('/login?next=/checkout')} />} /></Screen>;
  if (cart.lines.length === 0) return <Screen><Empty title="Nothing to check out" text="Your cart is empty." action={<Button title="Browse products" onPress={() => router.replace('/browse')} />} /></Screen>;
  if (q.loading && !q.data) return <Loading full />;

  const rows = cart.lines.map((l) => ({ l, p: q.data?.find((x) => x.id === l.product_id) })).filter((r): r is { l: CartLine; p: ProductView } => !!r.p);
  const subtotal = rows.reduce((s, r) => s + r.p.final_price * r.l.quantity, 0);
  const del = calcDelivery(rows.map((r) => ({ p: r.p, quantity: r.l.quantity })));

  const submit = async () => {
    const er: Record<string, string> = {};
    if (f.full_name.trim().length < 3) er.full_name = 'Enter your full name.';
    if (!/^(\+92|0)3\d{2}[\s-]?\d{7}$/.test(f.phone.replace(/\s/g, ''))) er.phone = 'Enter a Pakistani mobile number like 0300 1234567.';
    if (f.address.trim().length < 10) er.address = 'Enter your house, street and area so the rider can find you.';
    setErr(er); if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const orders = await placeOrder(user.id, cart.lines, f);
      cart.clear();
      router.replace(`/order-success?no=${encodeURIComponent(orders.map((o) => o.order_no).join(','))}`);
    } catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };

  return (
    <Screen>
      <Card>
        <Txt v="h3">Delivery details</Txt>
        <Field label="Full name" value={f.full_name} onChangeText={set('full_name')} error={err.full_name} autoCapitalize="words" />
        <Field label="Mobile number" value={f.phone} onChangeText={set('phone')} error={err.phone} keyboardType="phone-pad" placeholder="0300 1234567" />
        <Field label="Complete address" value={f.address} onChangeText={set('address')} error={err.address} multiline placeholder="House no., street, area" />
        <Select label="City" value={f.city} onChange={set('city')} options={CITIES.map((c) => ({ value: c, label: c }))} />
        <Field label="Notes for the shop (optional)" value={f.notes} onChangeText={set('notes')} multiline placeholder="e.g. call before delivery" />
        <Card style={{ borderColor: C.indigo, backgroundColor: C.indigo50 }}><Row><Ionicons name="cash-outline" size={24} color={C.indigo} /><View2 /></Row></Card>
      </Card>
      <Card>
        <Txt v="h3">Your order</Txt>
        {rows.map(({ l, p }) => <KV key={`${l.product_id}${l.size}${l.color}`} k={`${p.name} · ${l.size}, ${l.color} × ${l.quantity}`} v={rs(p.final_price * l.quantity)} />)}
        {del.shops.length > 1 && <Txt v="small" color={C.goldDark}>Your cart has items from {del.shops.length} shops, so you’ll get {del.shops.length} separate orders with their own order numbers, delivery charges and delivery dates. You pay each one in cash when it arrives.</Txt>}
        <KV k="Subtotal" v={rs(subtotal)} />
        {del.shops.map((s) => <KV key={s.shop_id} k={`Delivery${del.shops.length > 1 ? ` · ${s.shop_name}` : ''}`} v={s.charge ? rs(s.charge) : 'Free'} />)}
        <KV k="Pay on delivery" v={rs(subtotal + del.total)} bold />
        <Button title="Place order" variant="gold" loading={busy} onPress={submit} />
      </Card>
    </Screen>
  );
}
function View2() { return <Txt style={{ flex: 1 }}><Txt bold color={C.indigo}>Cash on delivery</Txt>{'\n'}<Txt v="small">Pay the rider in cash when your parcel arrives.</Txt></Txt>; }
