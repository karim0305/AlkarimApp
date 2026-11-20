import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ImageBackground, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@/hooks/useQuery';
import { getHomeSections, getLiveAnnouncements, getLiveSlides, resolveSection } from '@/services/homepage';
import { listShops } from '@/services/shops';
import { publicCategories } from '@/services/analytics';
import { listHomeReviews } from '@/services/reviews';
import { BrandLogo, ProductCard } from '@/components/shared';
import { Card, Chip, ChipRow, Loading, ProductImage, Row, SectionTitle, Stars, Txt, Button } from '@/components/ui';
import { ANNOUNCE_THEMES, BANNER_THEMES } from '@/lib/homeThemes';
import { openLink } from '@/lib/links';
import { rs } from '@/lib/format';
import { C } from '@/lib/theme';
import type { HeroSlide, HomeSection, LiveAnnouncement } from '@/lib/types';

function AnnouncementBar({ items, top }: { items: LiveAnnouncement[]; top: number }) {
  const router = useRouter(); const [i, setI] = useState(0);
  useEffect(() => { if (items.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % items.length), 5500); return () => clearInterval(t); }, [items.length]);
  if (!items.length) return <View style={{ height: top }} />;
  const a = items[i % items.length]; const th = ANNOUNCE_THEMES[a.theme];
  const link = a.link || (a.shop_id ? `/shops/${a.shop_id}` : ''); const label = a.link_label || (a.shop_id ? 'Visit shop' : 'Shop now');
  return (
    <View style={{ backgroundColor: th.bg, paddingTop: top + 6, paddingBottom: 8, paddingHorizontal: 14 }} accessibilityRole="header">
      <Text style={{ color: th.fg, textAlign: 'center', fontSize: 12.5, lineHeight: 18 }}>
        {a.shop_name ? <Text style={{ fontWeight: '800' }}>{a.shop_name}  </Text> : null}{a.text}
        {link ? <Text onPress={() => openLink(router, link)} style={{ fontWeight: '800', textDecorationLine: 'underline' }}>  {label}</Text> : null}
      </Text>
    </View>
  );
}

const FALLBACK: HeroSlide = { id: 'fallback', title: 'Eid ki shopping, ek hi jagah.', subtitle: 'Order from verified shops and pay cash when it reaches your door.', btn1_label: 'Shop all clothing', btn1_link: '/products', btn2_label: 'Meet the shops', btn2_link: '/shops', theme: 'indigo', image_url: null, shop_id: null, product_ids: [], sort_order: 0, is_active: true, starts_at: null, ends_at: null, shop: null, products: [] };

function Slide({ s, width }: { s: HeroSlide; width: number }) {
  const router = useRouter(); const t = BANNER_THEMES[s.theme] ?? BANNER_THEMES.indigo;
  const body = (
    <View style={{ padding: 18, paddingBottom: 34, gap: 10, backgroundColor: s.image_url ? t.bg + 'B3' : 'transparent' }}>
      {s.shop && <View style={{ alignSelf: 'flex-start', backgroundColor: C.gold, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}><Text style={{ fontSize: 11, fontWeight: '800', color: C.indigoDark }}>From {s.shop.name} · {s.shop.city}</Text></View>}
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 33 }}>{s.title}</Text>
      {s.subtitle ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20 }}>{s.subtitle}</Text> : null}
      <Row style={{ gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        {s.btn1_label && s.btn1_link ? <Button title={s.btn1_label} variant="gold" small onPress={() => openLink(router, s.btn1_link)} /> : null}
        {s.btn2_label && s.btn2_link ? <Pressable onPress={() => openLink(router, s.btn2_link)} style={{ borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, minHeight: 36, justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{s.btn2_label}</Text></Pressable> : null}
      </Row>
      {s.products.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 8 }}>
          {s.products.map((p) => (
            <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)} style={{ width: 104, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: C.gold, backgroundColor: '#fff' }}>
              <ProductImage uri={p.images[0]} colors={p.colors} />
              <View style={{ backgroundColor: C.indigoDark, padding: 5 }}><Text numberOfLines={1} style={{ color: '#fff', fontSize: 10.5 }}>{p.name}</Text><Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{rs(p.final_price)}</Text></View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
  return s.image_url
    ? <ImageBackground source={{ uri: s.image_url }} style={{ width, backgroundColor: t.bg }} resizeMode="cover">{body}</ImageBackground>
    : <View style={{ width, backgroundColor: t.bg }}>{body}</View>;
}

function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { width } = useWindowDimensions(); const ref = useRef<FlatList<HeroSlide>>(null); const [i, setI] = useState(0);
  const list = slides.length ? slides : [FALLBACK];
  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((x) => { const n = (x + 1) % list.length; ref.current?.scrollToIndex({ index: n, animated: true }); return n; }), 6500);
    return () => clearInterval(t);
  }, [list.length]);
  return (
    <View>
      <FlatList ref={ref} data={list} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(s) => s.id} getItemLayout={(_, k) => ({ length: width, offset: width * k, index: k })}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))} renderItem={({ item }) => <Slide s={item} width={width} />} />
      {list.length > 1 && <Row style={{ position: 'absolute', bottom: 10, alignSelf: 'center', gap: 6 }}>{list.map((s, k) => <View key={s.id} style={{ height: 8, width: k === i ? 22 : 8, borderRadius: 4, backgroundColor: k === i ? C.gold : 'rgba(255,255,255,0.55)' }} />)}</Row>}
    </View>
  );
}

function ProductRow({ section }: { section: HomeSection }) {
  const router = useRouter();
  const q = useQuery(() => resolveSection(section), [JSON.stringify(section)]);
  if (!section.enabled || (!q.loading && (q.error || !q.data?.length))) return null;
  const sort = section.mode === 'best_selling' ? 'popular' : section.mode === 'latest' ? 'latest' : '';
  const go = () => router.push(`/browse?${[sort && `sort=${sort}`, section.shop_id && `shop=${section.shop_id}`].filter(Boolean).join('&')}`);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ paddingHorizontal: 16 }}><SectionTitle title={section.title} action="See all" onAction={go} /></View>
      {q.loading ? <Loading /> : <FlatList data={q.data!} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} keyExtractor={(p) => p.id} renderItem={({ item }) => <ProductCard p={item} style={{ width: 170 }} />} />}
    </View>
  );
}

export default function Home() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const ann = useQuery(getLiveAnnouncements); const slides = useQuery(getLiveSlides); const sections = useQuery(getHomeSections);
  const shops = useQuery(() => listShops({ activeOnly: true })); const cats = useQuery(publicCategories); const reviews = useQuery(() => listHomeReviews(6));
  const [search, setSearch] = useState(''); const [pulling, setPulling] = useState(false);
  const refreshAll = useCallback(async () => { setPulling(true); ann.reload(); slides.reload(); sections.reload(); shops.reload(); cats.reload(); reviews.reload(); setTimeout(() => setPulling(false), 800); }, [ann, slides, sections, shops, cats, reviews]);
  const sec = (k: string) => sections.data?.find((s) => s.key === k);

  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <AnnouncementBar items={ann.data ?? []} top={insets.top} />
      <ScrollView refreshControl={undefined} contentContainerStyle={{ paddingBottom: 30, gap: 22 }} keyboardShouldPersistTaps="handled" onScrollEndDrag={undefined}>
        <View style={{ backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><BrandLogo small /><Pressable onPress={refreshAll} hitSlop={10} accessibilityLabel="Refresh"><Ionicons name="refresh" size={20} color={pulling ? C.faint : C.indigo} /></Pressable></Row>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 99, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14 }}>
            <Ionicons name="search" size={18} color={C.faint} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search kurtas, lawn, waistcoats or shops" placeholderTextColor={C.faint} returnKeyType="search" onSubmitEditing={() => router.push(`/browse?q=${encodeURIComponent(search)}`)} style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 8, fontSize: 14 }} accessibilityLabel="Search products" />
          </View>
        </View>

        {slides.loading ? <Loading /> : <HeroSlider slides={slides.data ?? []} />}

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Txt v="h2">Shop by category</Txt>
          <ChipRow>{(cats.data ?? []).map((c) => <Chip key={c.id} label={c.name} onPress={() => router.push(`/browse?category=${c.id}`)} />)}</ChipRow>
        </View>

        {sec('featured') && <ProductRow section={sec('featured')!} />}
        {sec('latest') && <ProductRow section={sec('latest')!} />}

        {(shops.data ?? []).length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ paddingHorizontal: 16 }}><SectionTitle title="Shops we trust" action="All shops" onAction={() => router.push('/stores')} /></View>
            <FlatList data={(shops.data ?? []).slice(0, 8)} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }} keyExtractor={(s) => s.id}
              renderItem={({ item }) => (
                <Card onPress={() => router.push(`/store/${item.id}`)} style={{ width: 200, gap: 4 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: C.indigo, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.gold, fontWeight: '800', fontSize: 18 }}>{item.name[0]}</Text></View>
                  <Txt v="h3" numberOfLines={1}>{item.name}</Txt><Txt v="small">{item.city} · {item.product_count} products</Txt>
                </Card>
              )} />
          </View>
        )}

        {sec('popular') && <ProductRow section={sec('popular')!} />}

        {(reviews.data ?? []).length > 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ paddingHorizontal: 16 }}><Txt v="h2">What customers say</Txt><Txt v="small">Reviews from people who received their order.</Txt></View>
            <FlatList data={reviews.data!} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} keyExtractor={(r) => r.id}
              renderItem={({ item }) => (
                <Card style={{ width: 270, gap: 8 }} onPress={() => router.push(`/product/${item.product_id}`)}>
                  <Stars value={item.rating} size={15} /><Txt numberOfLines={5}>{item.comment}</Txt>
                  <Txt v="small" bold>{item.customer_name}</Txt><Txt v="tiny" numberOfLines={1}>on {item.product_name} · {item.shop_name}</Txt>
                </Card>
              )} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
