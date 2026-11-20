import React, { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@/hooks/useQuery';
import { useMyShop } from '@/hooks/useMyShop';
import { useConfirm, useToast } from '@/context/toast';
import { usePlatform } from '@/context/platform';
import { deleteProduct, getProduct, saveProduct } from '@/services/products';
import { publicCategories } from '@/services/analytics';
import { Button, Card, Chip, ChipWrap, Empty, Field, Loading, Row, Screen, Select, Txt } from '@/components/ui';
import { COLOR_HEX, SIZES } from '@/lib/colors';
import { C } from '@/lib/theme';
import { finalPrice, rs } from '@/lib/format';

const MAX_PHOTOS = 5;

/** Add a new product (id = "new") or edit an existing one. */
export default function ShopProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>(); const isNew = id === 'new';
  const router = useRouter(); const toast = useToast(); const confirm = useConfirm(); const { rate, pct } = usePlatform();
  const { shop, shopId } = useMyShop(); const prefix = shop?.shop_code ?? '';
  const cats = useQuery(publicCategories);
  const existing = useQuery(() => (isNew ? Promise.resolve(null) : getProduct(id)), [id]);
  const [f, setF] = useState({ name: '', description: '', category_id: '', price: '', discount: '0', stock: '', codeNo: '' });
  const [sizes, setSizes] = useState<string[]>([]); const [colors, setColors] = useState<string[]>([]); const [images, setImages] = useState<string[]>([]);
  const [err, setErr] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    const p = existing.data;
    if (p && !loaded) {
      setF({ name: p.name, description: p.description, category_id: p.category_id, price: String(p.price), discount: String(p.discount_percent), stock: String(p.stock), codeNo: p.code.split('-').pop() ?? '' });
      setSizes(p.sizes); setColors(p.colors); setImages(p.images); setLoaded(true);
    }
  }, [existing.data, loaded]);

  if (!isNew && existing.loading) return <Loading full />;
  if (!isNew && (!existing.data || existing.data.shop_id !== shopId)) return <Empty title="Product not found" text="It does not exist or belongs to another shop." />;

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const toggle = (list: string[], set_: (v: string[]) => void, v: string) => set_(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const pick = async () => {
    const left = MAX_PHOTOS - images.length;
    if (left <= 0) { toast(`You can add up to ${MAX_PHOTOS} photos.`, 'info'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: left, quality: 0.7 });
    if (!res.canceled) setImages([...images, ...res.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    const er: Record<string, string> = {};
    if (!prefix) er.codeNo = 'Your shop code is still loading. Try again in a moment.';
    else if (!/^\d{1,6}$/.test(f.codeNo)) er.codeNo = 'Enter a number of 1 to 6 digits.';
    if (f.name.trim().length < 3) er.name = 'Give the product a name.';
    if (!f.category_id) er.category = 'Pick a category.';
    if (!(+f.price > 0)) er.price = 'Enter a price above Rs. 0.';
    if (+f.discount < 0 || +f.discount > 90) er.discount = 'Discount must be between 0 and 90.';
    if (f.stock === '' || !(+f.stock >= 0)) er.stock = 'Enter stock quantity.';
    if (!sizes.length) er.sizes = 'Select at least one size.';
    if (!colors.length) er.colors = 'Select at least one colour.';
    setErr(er);
    if (Object.keys(er).length) { toast('Please fix the highlighted fields.', 'error'); return; }
    setBusy(true);
    try {
      await saveProduct({ id: isNew ? undefined : id, code: `${prefix}-${f.codeNo}`, shop_id: shopId, name: f.name.trim(), category_id: f.category_id, description: f.description, price: +f.price, discount_percent: +f.discount || 0, stock: +f.stock, sizes, colors, images, featured: existing.data?.featured ?? false });
      toast(isNew ? 'Product published.' : 'Product updated.'); router.back();
    } catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Delete this product?', message: 'It will be removed from the marketplace. Past orders keep their details.', confirmLabel: 'Delete product', danger: true }))) return;
    try { await deleteProduct(id); toast('Product deleted.', 'info'); router.back(); } catch (x) { toast((x as Error).message, 'error'); }
  };
  const net = +f.price > 0 ? finalPrice(+f.price, +f.discount || 0) : 0;

  return (
    <Screen>
      <Card>
        <Field label="Product name" value={f.name} onChangeText={set('name')} error={err.name} autoCapitalize="words" />
        <Field label="Description" value={f.description} onChangeText={set('description')} multiline placeholder="Fabric, fit, care instructions" />
        <Select label="Category" value={f.category_id} onChange={(v) => setF({ ...f, category_id: v })} options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))} />
        {err.category ? <Txt v="tiny" color={C.crimson}>{err.category}</Txt> : null}
      </Card>
      <Card>
        <Field label="Product code" prefix={`${prefix || '…'}-`} value={f.codeNo} onChangeText={(t) => setF({ ...f, codeNo: t.replace(/\D/g, '') })} keyboardType="number-pad" maxLength={6} placeholder="1042" error={err.codeNo} hint="The first part is fixed for your shop, so codes never clash with another shop. You choose the number." />
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Price (Rs.)" value={f.price} onChangeText={(t) => set('price')(t.replace(/\D/g, ''))} keyboardType="number-pad" error={err.price} /></View>
          <View style={{ flex: 1 }}><Field label="Discount (%)" value={f.discount} onChangeText={(t) => set('discount')(t.replace(/\D/g, ''))} keyboardType="number-pad" error={err.discount} /></View>
        </Row>
        <Field label="Stock quantity" value={f.stock} onChangeText={(t) => set('stock')(t.replace(/\D/g, ''))} keyboardType="number-pad" error={err.stock} />
        {net > 0 && <Txt v="small" style={{ backgroundColor: C.indigo50, padding: 10, borderRadius: 10 }}>Customers pay <Txt v="small" bold>{rs(net)}</Txt>. If delivered you keep <Txt v="small" bold>{rs(net * (1 - rate))}</Txt> after {pct} commission.</Txt>}
      </Card>
      <Card>
        <Txt v="label">Sizes</Txt><ChipWrap>{SIZES.map((s) => <Chip key={s} label={s} selected={sizes.includes(s)} onPress={() => toggle(sizes, setSizes, s)} />)}</ChipWrap>
        {err.sizes ? <Txt v="tiny" color={C.crimson}>{err.sizes}</Txt> : null}
        <Txt v="label" style={{ marginTop: 6 }}>Colours</Txt><ChipWrap>{Object.entries(COLOR_HEX).map(([n, h]) => <Chip key={n} label={n} dot={h} selected={colors.includes(n)} onPress={() => toggle(colors, setColors, n)} />)}</ChipWrap>
        {err.colors ? <Txt v="tiny" color={C.crimson}>{err.colors}</Txt> : null}
      </Card>
      <Card>
        <Txt v="label">Photos <Txt v="small">(up to {MAX_PHOTOS})</Txt></Txt>
        <Row style={{ flexWrap: 'wrap', gap: 10 }}>
          {images.map((uri, i) => (
            <View key={uri + i}><Image source={{ uri }} style={{ width: 84, height: 104, borderRadius: 10 }} /><Pressable onPress={() => setImages(images.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: C.white, borderRadius: 12 }} accessibilityLabel="Remove photo"><Ionicons name="close-circle" size={24} color={C.crimson} /></Pressable></View>
          ))}
          {images.length < MAX_PHOTOS && <Pressable onPress={pick} style={{ width: 84, height: 104, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Add photos"><Ionicons name="image-outline" size={26} color={C.faint} /><Txt v="tiny">Add</Txt></Pressable>}
        </Row>
      </Card>
      <Button title={isNew ? 'Publish product' : 'Save changes'} loading={busy} onPress={submit} />
      {!isNew && <Button title="Delete product" variant="outline" icon="trash-outline" onPress={remove} />}
    </Screen>
  );
}
