import { getProductsByIds, listProducts } from './products';
import { listShops } from './shops';
import { isLive } from '../lib/homeThemes';
import { extOf, genId, mimeOf } from '../lib/id';
import type { HeroSlide, LiveAnnouncement, ProductView } from '../lib/types';

import { notify } from '../lib/events';
import { must, sb } from './_client';
import type { Announcement, Banner, HomeSection } from '../lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const orderBy = async <T,>(table: string): Promise<T[]> => must<T[]>(await sb().from(table).select('*').order('sort_order'));

export const listAnnouncements = () => orderBy<Announcement>('announcements');
export const listBanners = () => orderBy<Banner>('banners');

async function save(table: string, row: any) {
  const { id, ...fields } = row;
  if (id) must(await sb().from(table).update(fields).eq('id', id));
  else { const n = (await sb().from(table).select('id', { count: 'exact', head: true })).count ?? 0; must(await sb().from(table).insert({ ...fields, sort_order: n })); }
  notify();
}
async function remove(table: string, id: string) { must(await sb().from(table).delete().eq('id', id)); notify(); }
async function reorder(table: string, ids: string[]) {
  await Promise.all(ids.map((id, i) => sb().from(table).update({ sort_order: i }).eq('id', id)));
  notify();
}
export const saveAnnouncement = (a: Omit<Announcement, 'id' | 'sort_order'> & { id?: string }) => save('announcements', a);
export const deleteAnnouncement = (id: string) => remove('announcements', id);
export const reorderAnnouncements = (ids: string[]) => reorder('announcements', ids);
export const saveBanner = (b: Omit<Banner, 'id' | 'sort_order'> & { id?: string }) => save('banners', b);
export const deleteBanner = (id: string) => remove('banners', id);
export const reorderBanners = (ids: string[]) => reorder('banners', ids);

export async function listSections(): Promise<HomeSection[]> { return orderBy<HomeSection>('home_sections').catch(async () => must<HomeSection[]>(await sb().from('home_sections').select('*'))); }
export async function saveSection(s: HomeSection): Promise<void> { must(await sb().from('home_sections').upsert(s, { onConflict: 'key' })); notify(); }

/** Admin-only bucket "site-images" (see migration 009). */
export async function uploadSiteImage(uri: string): Promise<string> {
  const type = mimeOf(uri);
  const buf = await (await fetch(uri)).arrayBuffer();
  const path = `banners/${genId()}.${extOf(type)}`;
  const up = await sb().storage.from('site-images').upload(path, buf, { contentType: type });
  if (up.error) throw new Error(`Image upload failed: ${up.error.message}`);
  return sb().storage.from('site-images').getPublicUrl(path).data.publicUrl;
}

const SECTION_DEFAULTS: HomeSection[] = [
  { key: 'featured', title: 'Featured this week', mode: 'manual', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
  { key: 'popular', title: 'Popular right now', mode: 'best_selling', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
  { key: 'latest', title: 'Just added', mode: 'latest', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
];
/** Always returns all three sections, filling in defaults for any row that doesn't exist yet. */
export async function getHomeSections(): Promise<HomeSection[]> {
  const rows = await listSections().catch(() => [] as HomeSection[]);
  return SECTION_DEFAULTS.map((d) => rows.find((r) => r.key === d.key) ?? d);
}

/** Products by id, in the admin's order, hiding anything from shops that aren't active. */
async function byIds(ids: string[]): Promise<ProductView[]> {
  if (!ids.length) return [];
  const [prods, shops] = await Promise.all([getProductsByIds(ids), listShops({ activeOnly: true })]);
  const active = new Set(shops.map((x) => x.id));
  return ids.map((id) => prods.find((p) => p.id === id)).filter((p): p is ProductView => !!p && active.has(p.shop_id));
}

export async function resolveSection(sec: HomeSection): Promise<ProductView[]> {
  if (!sec.enabled) return [];
  if (sec.mode === 'manual') return byIds(sec.product_ids);
  return listProducts({ shop: sec.shop_id ?? undefined, sort: sec.mode === 'best_selling' ? 'popular' : 'latest', limit: sec.item_limit });
}

export async function getLiveAnnouncements(): Promise<LiveAnnouncement[]> {
  const [list, shops] = await Promise.all([listAnnouncements(), listShops({ activeOnly: true })]);
  const names = new Map(shops.map((x) => [x.id, x.name]));
  return list.filter((a) => isLive(a)).sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({ ...a, shop_name: a.shop_id ? names.get(a.shop_id) ?? null : null }))
    .filter((a) => !a.shop_id || a.shop_name); // an announcement for a deactivated shop is hidden
}

export async function getLiveSlides(): Promise<HeroSlide[]> {
  const [list, shops] = await Promise.all([listBanners(), listShops({ activeOnly: true })]);
  const byShop = new Map(shops.map((x) => [x.id, x]));
  const liveOnes = list.filter((b) => isLive(b)).sort((a, b) => a.sort_order - b.sort_order).filter((b) => !b.shop_id || byShop.has(b.shop_id));
  return Promise.all(liveOnes.map(async (b) => {
    const shop = b.shop_id ? byShop.get(b.shop_id) : undefined;
    const products = b.product_ids.length ? (await byIds(b.product_ids)).slice(0, 4) : shop ? await listProducts({ shop: shop.id, sort: 'popular', limit: 4 }) : [];
    return { ...b, shop: shop ? { id: shop.id, name: shop.name, city: shop.city } : null, products };
  }));
}
