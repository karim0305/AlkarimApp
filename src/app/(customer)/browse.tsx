import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@/hooks/useQuery';
import { listProducts } from '@/services/products';
import { listShops } from '@/services/shops';
import { publicCategories } from '@/services/analytics';
import { ProductGrid } from '@/components/ProductGrid';
import { Button, Chip, ChipWrap, Empty, ErrorBox, Field, Loading, Row, Select, Sheet, Txt } from '@/components/ui';
import { C } from '@/lib/theme';
import { SIZES } from '@/lib/colors';

type Sort = 'latest' | 'popular' | 'price-asc' | 'price-desc';
const SORTS: [Sort, string][] = [['latest', 'Newest'], ['popular', 'Popular'], ['price-asc', 'Price ↑'], ['price-desc', 'Price ↓']];

export default function Browse() {
  const params = useLocalSearchParams<{ q?: string; category?: string; shop?: string; sort?: string }>();
  const [q, setQ] = useState(params.q ?? ''); const [term, setTerm] = useState(params.q ?? '');
  const [category, setCategory] = useState(params.category ?? ''); const [shop, setShop] = useState(params.shop ?? '');
  const [sort, setSort] = useState<Sort>((params.sort as Sort) || 'latest'); const [size, setSize] = useState('');
  const [min, setMin] = useState(''); const [max, setMax] = useState(''); const [open, setOpen] = useState(false);
  // arriving from the home page with a category / search / shop
  useEffect(() => { setQ(params.q ?? ''); setTerm(params.q ?? ''); setCategory(params.category ?? ''); setShop(params.shop ?? ''); setSort((params.sort as Sort) || 'latest'); }, [params.q, params.category, params.shop, params.sort]);
  useEffect(() => { const t = setTimeout(() => setTerm(q), 400); return () => clearTimeout(t); }, [q]);

  const products = useQuery(() => listProducts({ q: term, category, shop, size, sort, minPrice: min ? +min : undefined, maxPrice: max ? +max : undefined }), [term, category, shop, size, sort, min, max]);
  const cats = useQuery(publicCategories); const shops = useQuery(() => listShops({ activeOnly: true }));
  const active = [category, shop, size, min, max].filter(Boolean).length;
  const clear = () => { setCategory(''); setShop(''); setSize(''); setMin(''); setMax(''); setSort('latest'); };

  const header = (
    <View style={{ padding: 16, gap: 10 }}>
      <Row>
        <View style={{ flex: 1 }}><Field value={q} onChangeText={setQ} placeholder="Search kurtas, lawn, code or shop" /></View>
        <View><Button title={active ? `Filters (${active})` : 'Filters'} variant="outline" small icon="options-outline" onPress={() => setOpen(true)} /></View>
      </Row>
      <Row style={{ justifyContent: 'space-between' }}><Txt v="small">{products.data ? `${products.data.length} products` : ''}</Txt>{active > 0 && <Txt v="small" color={C.crimson} bold onPress={clear}>Clear filters</Txt>}</Row>
    </View>
  );
  if (products.loading && !products.data) return <><View style={{ backgroundColor: C.surface }}>{header}</View><Loading full /></>;
  if (products.error) return <ErrorBox message={products.error} retry={products.reload} />;
  return (
    <>
      <ProductGrid data={products.data ?? []} header={header} onRefresh={products.refresh} refreshing={products.refreshing}
        empty={<Empty title="No products match" text="Try removing a filter or searching for something broader like “kurta” or “lawn”." action={<Button title="Clear filters" small onPress={() => { clear(); setQ(''); }} />} />} />
      <Sheet visible={open} onClose={() => setOpen(false)} title="Filters">
        <Txt v="label">Sort by</Txt>
        <ChipWrap>{SORTS.map(([v, l]) => <Chip key={v} label={l} selected={sort === v} onPress={() => setSort(v)} />)}</ChipWrap>
        <Txt v="label">Category</Txt>
        <ChipWrap><Chip label="All" selected={!category} onPress={() => setCategory('')} />{(cats.data ?? []).map((c) => <Chip key={c.id} label={c.name} selected={category === c.id} onPress={() => setCategory(c.id)} />)}</ChipWrap>
        <Select label="Shop" value={shop} onChange={setShop} options={[{ value: '', label: 'All shops' }, ...(shops.data ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
        <Txt v="label">Size</Txt>
        <ChipWrap>{SIZES.map((s) => <Chip key={s} label={s} selected={size === s} onPress={() => setSize(size === s ? '' : s)} />)}</ChipWrap>
        <Row><View style={{ flex: 1 }}><Field label="Min price (Rs.)" value={min} onChangeText={(t) => setMin(t.replace(/\D/g, ''))} keyboardType="number-pad" /></View><View style={{ flex: 1 }}><Field label="Max price (Rs.)" value={max} onChangeText={(t) => setMax(t.replace(/\D/g, ''))} keyboardType="number-pad" /></View></Row>
        <Row><Button title="Clear all" variant="outline" style={{ flex: 1 }} onPress={clear} /><Button title="Show results" style={{ flex: 1 }} onPress={() => setOpen(false)} /></Row>
      </Sheet>
    </>
  );
}
