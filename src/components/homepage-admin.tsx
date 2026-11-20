import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@/hooks/useQuery';
import { useConfirm, useToast } from '@/context/toast';
import { deleteAnnouncement, deleteBanner, getHomeSections, listAnnouncements, listBanners, reorderAnnouncements, reorderBanners, saveAnnouncement, saveBanner, saveSection, uploadSiteImage } from '@/services/homepage';
import { listShops } from '@/services/shops';
import { publicCategories } from '@/services/analytics';
import { ProductPicker, LinkSelect, ScheduleFields, dayEnd, dayStart, isDayOrEmpty, toDay } from './homepage-fields';
import { Button, Card, Check, Chip, ChipWrap, Empty, Field, Loading, Row, Select, Sheet, Txt } from './ui';
import { ANNOUNCE_THEMES, BANNER_THEMES, isLive, isValidLink } from '@/lib/homeThemes';
import { C } from '@/lib/theme';
import { shortDate } from '@/lib/format';
import type { Announcement, AnnounceTheme, Banner, BannerTheme, HomeSection, SectionMode } from '@/lib/types';

const status = (x: { is_active: boolean; starts_at: string | null; ends_at: string | null }): [string, string] =>
  !x.is_active ? ['Hidden', C.muted] : isLive(x) ? ['Live', C.green] : x.starts_at && new Date(x.starts_at) > new Date() ? ['Scheduled', '#0369A1'] : ['Expired', C.crimson];
const IDEAS = ['Eid sale: up to 30% off lawn', 'New shop joined: welcome to the marketplace', 'Free delivery on orders above Rs. 5,000', 'New arrivals every Friday'];

/* ================= announcements ================= */
function AnnouncementForm({ initial, onDone }: { initial?: Announcement; onDone: () => void }) {
  const toast = useToast();
  const shops = useQuery(() => listShops({ activeOnly: true })); const cats = useQuery(publicCategories);
  const [f, setF] = useState({ text: initial?.text ?? '', link: initial?.link ?? '', label: initial?.link_label ?? '', shop: initial?.shop_id ?? '', theme: (initial?.theme ?? 'indigo') as AnnounceTheme, start: toDay(initial?.starts_at ?? null), end: toDay(initial?.ends_at ?? null), active: initial?.is_active ?? true });
  const [busy, setBusy] = useState(false);
  const th = ANNOUNCE_THEMES[f.theme];
  const submit = async () => {
    if (!f.text.trim()) { toast('Write the announcement text.', 'error'); return; }
    if (!isValidLink(f.link)) { toast('That link is not valid.', 'error'); return; }
    if (!isDayOrEmpty(f.start) || !isDayOrEmpty(f.end)) { toast('Dates must look like 2026-12-31.', 'error'); return; }
    setBusy(true);
    try { await saveAnnouncement({ id: initial?.id, text: f.text.trim(), link: f.link, link_label: f.label.trim(), shop_id: f.shop || null, theme: f.theme, is_active: f.active, starts_at: dayStart(f.start), ends_at: dayEnd(f.end) }); toast(initial ? 'Announcement updated.' : 'Announcement added.'); onDone(); }
    catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  return (
    <>
      <View style={{ backgroundColor: th.bg, borderRadius: 10, padding: 10 }}><Txt style={{ color: th.fg, textAlign: 'center', fontSize: 13 }}>{f.text || 'Your message appears here'}{(f.link || f.shop) ? `  ${f.label || 'Shop now'}` : ''}</Txt></View>
      <Field label={`Message (${f.text.length}/160)`} value={f.text} onChangeText={(t) => setF({ ...f, text: t })} maxLength={160} />
      <ChipWrap>{IDEAS.map((i) => <Chip key={i} label={i} onPress={() => setF({ ...f, text: i })} />)}</ChipWrap>
      <LinkSelect label="Link (optional)" value={f.link} onChange={(v) => setF({ ...f, link: v })} shops={shops.data ?? []} cats={cats.data ?? []} />
      <Field label="Link text" value={f.label} onChangeText={(t) => setF({ ...f, label: t })} placeholder="Shop now" />
      <Select label="From a shop (optional)" value={f.shop} onChange={(v) => setF({ ...f, shop: v })} options={[{ value: '', label: 'Platform announcement' }, ...(shops.data ?? []).map((s) => ({ value: s.id, label: s.name }))]} />
      <Txt v="label">Colour</Txt>
      <ChipWrap>{(Object.keys(ANNOUNCE_THEMES) as AnnounceTheme[]).map((k) => <Chip key={k} label={ANNOUNCE_THEMES[k].label} dot={ANNOUNCE_THEMES[k].bg} selected={f.theme === k} onPress={() => setF({ ...f, theme: k })} />)}</ChipWrap>
      <ScheduleFields start={f.start} end={f.end} active={f.active} onStart={(v) => setF({ ...f, start: v })} onEnd={(v) => setF({ ...f, end: v })} onActive={(v) => setF({ ...f, active: v })} />
      <Button title="Save announcement" loading={busy} onPress={submit} />
    </>
  );
}

export function AnnouncementsAdmin() {
  const q = useQuery(listAnnouncements); const confirm = useConfirm(); const toast = useToast();
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null);
  if (q.loading) return <Loading />;
  const list = q.data ?? [];
  const move = async (i: number, d: number) => { const ids = list.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; await reorderAnnouncements(ids); };
  const toggle = async (a: Announcement) => { const { id, sort_order, ...rest } = a; void sort_order; await saveAnnouncement({ ...rest, id, is_active: !a.is_active }); toast(a.is_active ? 'Announcement hidden.' : 'Announcement is live.', 'info'); };
  const del = async (a: Announcement) => { if (await confirm({ title: 'Delete this announcement?', message: 'It disappears from the top of the app and website.', confirmLabel: 'Delete', danger: true })) { await deleteAnnouncement(a.id); toast('Announcement deleted.', 'info'); } };
  return (
    <View style={{ gap: 12 }}>
      <Txt v="small">The strip at the top of the home screen. Several live messages rotate. Set dates and they switch on and off by themselves.</Txt>
      <Button title="New announcement" icon="add-circle-outline" onPress={() => setEditing('new')} />
      {list.length === 0 ? <Empty title="No announcements" text="With none live, the strip is hidden." /> : list.map((a, i) => { const [label, color] = status(a); return (
        <Card key={a.id}>
          <Row><View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: ANNOUNCE_THEMES[a.theme].bg }} /><Txt style={{ flex: 1 }} numberOfLines={2}>{a.text}</Txt></Row>
          <Row style={{ justifyContent: 'space-between' }}><Txt v="small" bold color={color}>{label}{a.ends_at ? ` · until ${shortDate(a.ends_at)}` : ''}</Txt></Row>
          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            <Button title="↑" small variant="outline" disabled={i === 0} onPress={() => move(i, -1)} /><Button title="↓" small variant="outline" disabled={i === list.length - 1} onPress={() => move(i, 1)} />
            <Button title={a.is_active ? 'Hide' : 'Show'} small variant="outline" onPress={() => toggle(a)} /><Button title="Edit" small variant="outline" onPress={() => setEditing(a)} /><Button title="Delete" small variant="outline" onPress={() => del(a)} />
          </Row>
        </Card>); })}
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New announcement' : 'Edit announcement'}>
        {editing && <AnnouncementForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </View>
  );
}

/* ================= banners ================= */
type Visual = 'decor' | 'shop' | 'products';
function BannerForm({ initial, onDone }: { initial?: Banner; onDone: () => void }) {
  const toast = useToast();
  const shops = useQuery(() => listShops({ activeOnly: true })); const cats = useQuery(publicCategories);
  const [f, setF] = useState({
    title: initial?.title ?? '', subtitle: initial?.subtitle ?? '', b1l: initial?.btn1_label ?? '', b1u: initial?.btn1_link ?? '', b2l: initial?.btn2_label ?? '', b2u: initial?.btn2_link ?? '',
    theme: (initial?.theme ?? 'indigo') as BannerTheme, image: initial?.image_url ?? '', shop: initial?.shop_id ?? '', ids: initial?.product_ids ?? ([] as string[]),
    visual: (initial?.product_ids.length ? 'products' : initial?.shop_id ? 'shop' : 'decor') as Visual, start: toDay(initial?.starts_at ?? null), end: toDay(initial?.ends_at ?? null), active: initial?.is_active ?? true,
  });
  const [busy, setBusy] = useState(false); const [up, setUp] = useState(false);
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled) return;
    setUp(true);
    try { const url = await uploadSiteImage(res.assets[0].uri); setF((x) => ({ ...x, image: url })); } catch (x) { toast((x as Error).message, 'error'); }
    setUp(false);
  };
  const submit = async () => {
    if (!f.title.trim()) { toast('Write a headline.', 'error'); return; }
    if (!isValidLink(f.b1u) || !isValidLink(f.b2u)) { toast('One of the button links is not valid.', 'error'); return; }
    if (f.visual === 'shop' && !f.shop) { toast('Choose which shop’s products to show.', 'error'); return; }
    if (f.visual === 'products' && f.ids.length === 0) { toast('Pick at least one product, or choose another option.', 'error'); return; }
    if (!isDayOrEmpty(f.start) || !isDayOrEmpty(f.end)) { toast('Dates must look like 2026-12-31.', 'error'); return; }
    setBusy(true);
    try {
      await saveBanner({ id: initial?.id, title: f.title.trim(), subtitle: f.subtitle.trim(), btn1_label: f.b1l.trim(), btn1_link: f.b1u, btn2_label: f.b2l.trim(), btn2_link: f.b2u, theme: f.theme, image_url: f.image || null,
        shop_id: f.visual === 'shop' ? f.shop : null, product_ids: f.visual === 'products' ? f.ids.slice(0, 4) : [], is_active: f.active, starts_at: dayStart(f.start), ends_at: dayEnd(f.end) });
      toast(initial ? 'Banner updated.' : 'Banner added.'); onDone();
    } catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  const t = BANNER_THEMES[f.theme];
  return (
    <>
      <View style={{ backgroundColor: t.bg, borderRadius: 10, padding: 14, gap: 4 }}><Txt v="tiny" color="#FFFFFFAA">Preview</Txt><Txt style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{f.title || 'Your headline'}</Txt>{f.subtitle ? <Txt v="small" color="#FFFFFFCC" numberOfLines={2}>{f.subtitle}</Txt> : null}</View>
      <Field label="Headline" value={f.title} onChangeText={(v) => setF({ ...f, title: v })} maxLength={100} />
      <Field label="Text under the headline" value={f.subtitle} onChangeText={(v) => setF({ ...f, subtitle: v })} multiline maxLength={300} />
      <Field label="Button 1 text" value={f.b1l} onChangeText={(v) => setF({ ...f, b1l: v })} />
      <LinkSelect label="Button 1 goes to" value={f.b1u} onChange={(v) => setF({ ...f, b1u: v })} shops={shops.data ?? []} cats={cats.data ?? []} />
      <Field label="Button 2 text (optional)" value={f.b2l} onChangeText={(v) => setF({ ...f, b2l: v })} />
      <LinkSelect label="Button 2 goes to" value={f.b2u} onChange={(v) => setF({ ...f, b2u: v })} shops={shops.data ?? []} cats={cats.data ?? []} />
      <Txt v="label">Colour</Txt>
      <ChipWrap>{(Object.keys(BANNER_THEMES) as BannerTheme[]).map((k) => <Chip key={k} label={BANNER_THEMES[k].label} dot={BANNER_THEMES[k].bg} selected={f.theme === k} onPress={() => setF({ ...f, theme: k })} />)}</ChipWrap>
      <Txt v="label">Background photo (optional)</Txt>
      {f.image ? <Row><Image source={{ uri: f.image }} style={{ width: 90, height: 52, borderRadius: 8 }} /><Button title="Remove" small variant="outline" onPress={() => setF({ ...f, image: '' })} /></Row> : <Button title={up ? 'Uploading…' : 'Choose photo'} variant="outline" icon="image-outline" loading={up} onPress={pick} />}
      <Txt v="label">Pictures shown on the banner</Txt>
      <ChipWrap>{([['decor', 'Plain decoration'], ['shop', 'One shop’s best sellers'], ['products', 'Hand-picked products']] as [Visual, string][]).map(([v, l]) => <Chip key={v} label={l} selected={f.visual === v} onPress={() => setF({ ...f, visual: v })} />)}</ChipWrap>
      {f.visual === 'shop' && <Select label="Shop" value={f.shop} onChange={(v) => setF({ ...f, shop: v })} options={(shops.data ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.product_count})` }))} />}
      {f.visual === 'products' && <ProductPicker value={f.ids} onChange={(ids) => setF({ ...f, ids })} max={4} />}
      <ScheduleFields start={f.start} end={f.end} active={f.active} onStart={(v) => setF({ ...f, start: v })} onEnd={(v) => setF({ ...f, end: v })} onActive={(v) => setF({ ...f, active: v })} />
      <Button title="Save banner" loading={busy} disabled={up} onPress={submit} />
    </>
  );
}

export function BannersAdmin() {
  const q = useQuery(listBanners); const confirm = useConfirm(); const toast = useToast();
  const [editing, setEditing] = useState<Banner | 'new' | null>(null);
  if (q.loading) return <Loading />;
  const list = q.data ?? [];
  const move = async (i: number, d: number) => { const ids = list.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; await reorderBanners(ids); };
  const toggle = async (b: Banner) => { const { id, sort_order, ...rest } = b; void sort_order; await saveBanner({ ...rest, id, is_active: !b.is_active }); toast(b.is_active ? 'Banner hidden.' : 'Banner is live.', 'info'); };
  const del = async (b: Banner) => { if (await confirm({ title: 'Delete this banner?', message: `“${b.title}” is removed from the home slider.`, confirmLabel: 'Delete', danger: true })) { await deleteBanner(b.id); toast('Banner deleted.', 'info'); } };
  return (
    <View style={{ gap: 12 }}>
      <Txt v="small">The big slider at the top of the home screen. Live banners play in this order. With none live, a default banner is shown.</Txt>
      <Button title="New banner" icon="add-circle-outline" onPress={() => setEditing('new')} />
      {list.length === 0 ? <Empty title="No banners" text="Add a banner for your Eid sale, a shop spotlight or a new collection." /> : list.map((b, i) => { const [label, color] = status(b); return (
        <Card key={b.id}>
          <Row>{b.image_url ? <Image source={{ uri: b.image_url }} style={{ width: 64, height: 40, borderRadius: 6 }} /> : <View style={{ width: 64, height: 40, borderRadius: 6, backgroundColor: BANNER_THEMES[b.theme].bg }} />}<View style={{ flex: 1 }}><Txt bold numberOfLines={1}>{b.title}</Txt><Txt v="tiny">{b.product_ids.length ? `${b.product_ids.length} hand-picked products` : b.shop_id ? 'One shop’s best sellers' : 'Decoration'}</Txt></View></Row>
          <Txt v="small" bold color={color}>{label}{b.ends_at ? ` · until ${shortDate(b.ends_at)}` : ''}</Txt>
          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            <Button title="↑" small variant="outline" disabled={i === 0} onPress={() => move(i, -1)} /><Button title="↓" small variant="outline" disabled={i === list.length - 1} onPress={() => move(i, 1)} />
            <Button title={b.is_active ? 'Hide' : 'Show'} small variant="outline" onPress={() => toggle(b)} /><Button title="Edit" small variant="outline" onPress={() => setEditing(b)} /><Button title="Delete" small variant="outline" onPress={() => del(b)} />
          </Row>
        </Card>); })}
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New banner' : 'Edit banner'}>
        {editing && <BannerForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </View>
  );
}

/* ================= product rows ================= */
const INFO: Record<string, { name: string; hint: string }> = {
  featured: { name: 'Featured this week', hint: 'Your hand-picked favourites.' },
  popular: { name: 'Popular right now', hint: 'Usually automatic: the best-selling products. You can limit it to one shop or hand-pick instead.' },
  latest: { name: 'Just added', hint: 'Newest products. Automatic, and can be limited to one shop.' },
};
function SectionCard({ section, shops }: { section: HomeSection; shops: { id: string; name: string }[] }) {
  const toast = useToast(); const [s, setS] = useState(section); const [busy, setBusy] = useState(false);
  useEffect(() => setS(section), [JSON.stringify(section)]); // eslint-disable-line
  const dirty = JSON.stringify(s) !== JSON.stringify(section);
  const save = async () => {
    if (!s.title.trim()) { toast('Give the section a title.', 'error'); return; }
    setBusy(true);
    try { await saveSection({ ...s, title: s.title.trim(), shop_id: s.mode === 'manual' ? null : s.shop_id }); toast(`“${s.title}” saved.`); } catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  return (
    <Card>
      <Txt v="h3">{INFO[s.key].name}</Txt><Txt v="small">{INFO[s.key].hint}</Txt>
      <Check checked={s.enabled} onChange={(v) => setS({ ...s, enabled: v })}><Txt>Show on the home screen</Txt></Check>
      <Field label="Heading" value={s.title} onChangeText={(t) => setS({ ...s, title: t })} maxLength={60} />
      <Select<SectionMode> label="Which products?" value={s.mode} onChange={(v) => setS({ ...s, mode: v })} options={[{ value: 'manual', label: 'I pick them by hand' }, { value: 'best_selling', label: 'Best sellers (automatic)' }, { value: 'latest', label: 'Newest (automatic)' }]} />
      {s.mode === 'manual' ? <><ProductPicker value={s.product_ids} onChange={(ids) => setS({ ...s, product_ids: ids })} max={12} />{s.product_ids.length === 0 && <Txt v="tiny" color={C.crimson}>Nothing picked, so this row is hidden until you add products.</Txt>}</> : (
        <>
          <Select label="From which shop?" value={s.shop_id ?? ''} onChange={(v) => setS({ ...s, shop_id: v || null })} options={[{ value: '', label: 'All shops' }, ...shops.map((x) => ({ value: x.id, label: x.name }))]} />
          <Select label="How many?" value={String(s.item_limit)} onChange={(v) => setS({ ...s, item_limit: +v })} options={['4', '8', '12'].map((n) => ({ value: n, label: `${n} products` }))} />
        </>
      )}
      <Button title="Save changes" loading={busy} disabled={!dirty} onPress={save} />
    </Card>
  );
}
export function SectionsAdmin() {
  const q = useQuery(getHomeSections); const shops = useQuery(() => listShops({ activeOnly: true }));
  if (q.loading) return <Loading />;
  return <View style={{ gap: 12 }}><Txt v="small">Choose what appears in each product row on the home screen. Products from deactivated shops are hidden automatically.</Txt>{(q.data ?? []).map((s) => <SectionCard key={s.key} section={s} shops={shops.data ?? []} />)}</View>;
}
