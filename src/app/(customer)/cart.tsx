import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { useCart } from '@/context/cart';
import { useConfirm, useToast } from '@/context/toast';
import { useQuery } from '@/hooks/useQuery';
import { getProductsByIds } from '@/services/products';
import { CustomerOnlyNotice } from '@/components/CustomerOnly';
import { Button, Card, Empty, KV, Loading, ProductImage, Row, Screen, Txt } from '@/components/ui';
import { calcDelivery } from '@/lib/delivery';
import { rs } from '@/lib/format';
import { C } from '@/lib/theme';
import type { CartLine, ProductView } from '@/lib/types';

export default function CartScreen() {
  const { user } = useAuth(); const cart = useCart(); const confirm = useConfirm(); const toast = useToast(); const router = useRouter();
  const ids = cart.lines.map((l) => l.product_id).join(',');
  const q = useQuery(() => getProductsByIds(cart.lines.map((l) => l.product_id)), [ids]);

  if (cart.lines.length === 0) return <Screen><Empty title="Your cart is empty" text="Add a few things you like and they’ll wait for you here." action={<Button title="Start shopping" onPress={() => router.push('/browse')} />} /></Screen>;
  if (q.loading && !q.data) return <Loading full />;

  const rows = cart.lines.map((l) => ({ l, p: q.data?.find((x) => x.id === l.product_id) })).filter((r): r is { l: CartLine; p: ProductView } => !!r.p);
  const subtotal = rows.reduce((s, r) => s + r.p.final_price * r.l.quantity, 0);
  const del = calcDelivery(rows.map((r) => ({ p: r.p, quantity: r.l.quantity })));
  const remove = async (l: CartLine, name: string) => { if (await confirm({ title: 'Remove this item?', message: `${name} will be taken out of your cart.`, confirmLabel: 'Remove', danger: true })) { cart.remove(l); toast('Item removed from your cart.', 'info'); } };

  return (
    <Screen>
      {user && user.role !== 'customer' && <CustomerOnlyNotice role={user.role} next="/cart" />}
      {rows.map(({ l, p }) => (
        <Card key={`${l.product_id}${l.size}${l.color}`} style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => router.push(`/product/${p.id}`)} style={{ width: 84, borderRadius: 10, overflow: 'hidden' }}><ProductImage uri={p.images[0]} colors={[l.color, ...p.colors]} /></Pressable>
          <View style={{ flex: 1, gap: 3 }}>
            <Txt bold numberOfLines={2}>{p.name}</Txt>
            <Txt v="tiny" color={C.crimson} bold>{p.shop_name}</Txt>
            <Txt v="small">Size {l.size} · {l.color}</Txt>
            <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <Row style={{ gap: 4 }}>
                <Pressable onPress={() => cart.setQty(l, l.quantity - 1)} style={qtyBtn} accessibilityLabel="Decrease quantity"><Ionicons name="remove" size={18} color={C.indigo} /></Pressable>
                <Txt bold style={{ minWidth: 26, textAlign: 'center' }}>{l.quantity}</Txt>
                <Pressable onPress={() => cart.setQty(l, Math.min(p.stock, l.quantity + 1))} style={qtyBtn} accessibilityLabel="Increase quantity"><Ionicons name="add" size={18} color={C.indigo} /></Pressable>
              </Row>
              <Txt v="h3">{rs(p.final_price * l.quantity)}</Txt>
            </Row>
          </View>
          <Pressable onPress={() => remove(l, p.name)} hitSlop={8} accessibilityLabel={`Remove ${p.name}`}><Ionicons name="trash-outline" size={20} color={C.faint} /></Pressable>
        </Card>
      ))}
      <Card>
        <Txt v="h3">Order summary</Txt>
        <KV k="Subtotal" v={rs(subtotal)} />
        {del.shops.map((s) => <KV key={s.shop_id} k={`Delivery${del.shops.length > 1 ? ` · ${s.shop_name}` : ''}`} v={s.charge ? rs(s.charge) : 'Free'} />)}
        <KV k="Total to pay on delivery" v={rs(subtotal + del.total)} bold />
        {del.shops.filter((s) => s.charge > 0 && s.freeAbove != null).map((s) => <Txt key={s.shop_id} v="tiny">Add {rs((s.freeAbove as number) - s.subtotal)} more from {s.shop_name} for free delivery.</Txt>)}
        {del.shops.length > 1 && <Txt v="small" color={C.goldDark}>Your items come from {del.shops.length} shops, so they’ll arrive as separate orders.</Txt>}
        <Button title="Proceed to checkout" onPress={() => router.push('/checkout')} />
      </Card>
    </Screen>
  );
}
const qtyBtn = { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.line, alignItems: 'center' as const, justifyContent: 'center' as const };
