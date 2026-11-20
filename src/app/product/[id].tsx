import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/cart';
import { useToast } from '@/context/toast';
import { useQuery } from '@/hooks/useQuery';
import { getProduct, relatedProducts } from '@/services/products';
import { listProductReviews } from '@/services/reviews';
import { ProductCard, ProductReviews, averageRating } from '@/components/shared';
import { Button, Chip, ChipWrap, Empty, ErrorBox, Loading, ProductImage, Row, Screen, SectionTitle, Stars, Txt } from '@/components/ui';
import { COLOR_HEX } from '@/lib/colors';
import { C } from '@/lib/theme';
import { rs } from '@/lib/format';

export default function ProductPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); const cart = useCart(); const toast = useToast(); const { width } = useWindowDimensions();
  const q = useQuery(() => getProduct(id), [id]);
  const rel = useQuery(() => relatedProducts(id), [id]);
  const rv = useQuery(() => listProductReviews(id), [id]);
  const [size, setSize] = useState(''); const [color, setColor] = useState(''); const [qty, setQty] = useState(1); const [img, setImg] = useState(0);
  const p = q.data;
  useEffect(() => { if (p) { setSize(p.sizes[0]); setColor(p.colors[0]); setQty(1); setImg(0); } }, [p?.id]); // eslint-disable-line

  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  if (!p) return <Empty title="Product not found" text="It may have been removed by the shop." />;

  const out = p.stock === 0; const line = { product_id: p.id, size, color, quantity: qty };
  const gallery = p.images.length ? p.images : [undefined];
  const avg = averageRating(rv.data ?? []);
  return (
    <Screen padded={false} onRefresh={() => { q.refresh(); rv.reload(); }} refreshing={q.refreshing}>
      <FlatList data={gallery} keyExtractor={(g, i) => `${g}${i}`} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setImg(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => <View style={{ width }}><ProductImage uri={item} colors={p.colors} ratio={0.9} /></View>} />
      {gallery.length > 1 && <Row style={{ justifyContent: 'center', paddingTop: 8 }}>{gallery.map((_, i) => <View key={i} style={{ width: i === img ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i === img ? C.indigo : '#CBD5E1' }} />)}</Row>}
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ gap: 4 }}>
          <Pressable onPress={() => router.push(`/store/${p.shop_id}`)}><Row><Ionicons name="storefront-outline" size={15} color={C.crimson} /><Txt v="small" color={C.crimson} bold>{p.shop_name}</Txt></Row></Pressable>
          <Txt v="title" style={{ fontSize: 22 }}>{p.name}</Txt>
          <Row style={{ gap: 14, flexWrap: 'wrap' }}><Txt v="small">Code: <Txt v="small" bold style={{ fontFamily: 'monospace' }}>{p.code}</Txt></Txt>{(rv.data ?? []).length > 0 && <Row style={{ gap: 5 }}><Stars value={avg} size={14} /><Txt v="small">{avg.toFixed(1)} ({(rv.data ?? []).length})</Txt></Row>}</Row>
        </View>
        <Row style={{ alignItems: 'baseline' }}>
          <Txt style={{ fontSize: 26, fontWeight: '800', color: C.indigoDark }}>{rs(p.final_price)}</Txt>
          {p.discount_percent > 0 && <><Txt v="small" style={{ textDecorationLine: 'line-through' }}>{rs(p.price)}</Txt><Txt v="small" color={C.crimson} bold>Save {p.discount_percent}%</Txt></>}
        </Row>
        <Txt>{p.description}</Txt>
        <View style={{ gap: 8 }}><Txt v="label">Size: {size}</Txt><ChipWrap>{p.sizes.map((s) => <Chip key={s} label={s} selected={size === s} onPress={() => setSize(s)} />)}</ChipWrap></View>
        <View style={{ gap: 8 }}><Txt v="label">Colour: {color}</Txt><ChipWrap>{p.colors.map((c) => <Chip key={c} label={c} dot={COLOR_HEX[c]} selected={color === c} onPress={() => setColor(c)} />)}</ChipWrap></View>
        <Txt bold color={out ? C.crimson : p.stock <= 10 ? C.amber : C.green}>{out ? 'Out of stock' : p.stock <= 10 ? `Only ${p.stock} left` : 'In stock'}</Txt>
        <Row style={{ gap: 12 }}>
          <Row style={{ borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.white }}>
            <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={{ padding: 12 }} accessibilityLabel="Decrease"><Ionicons name="remove" size={18} color={C.indigo} /></Pressable>
            <Txt bold style={{ minWidth: 26, textAlign: 'center' }}>{qty}</Txt>
            <Pressable onPress={() => setQty(Math.min(p.stock, qty + 1))} style={{ padding: 12 }} accessibilityLabel="Increase"><Ionicons name="add" size={18} color={C.indigo} /></Pressable>
          </Row>
          <Button title="Add to cart" variant="outline" disabled={out} style={{ flex: 1 }} onPress={() => { if (cart.add(line)) toast(`${p.name} added to your cart.`); }} />
        </Row>
        <Button title="Buy now" disabled={out} onPress={() => { if (cart.add(line)) router.push('/checkout'); }} />
        <Txt v="small" style={{ backgroundColor: C.indigo50, padding: 10, borderRadius: 10 }}>Cash on delivery. You pay {rs(p.final_price * qty)} when the order reaches you.</Txt>
        <ProductReviews reviews={rv.data ?? []} />
        {(rel.data ?? []).length > 0 && <><SectionTitle title="You may also like" /><FlatList data={rel.data ?? []} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(r) => r.id} contentContainerStyle={{ gap: 10 }} renderItem={({ item }) => <ProductCard p={item} style={{ width: 160 }} />} /></>}
      </View>
    </Screen>
  );
}
