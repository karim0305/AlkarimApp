import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@/hooks/useQuery';
import { listAllProducts } from '@/services/products';
import { isValidLink } from '@/lib/homeThemes';
import { Button, Check, Field, Row, Select, Sheet, Txt } from './ui';
import { C } from '@/lib/theme';
import { rs } from '@/lib/format';
import type { Category, ProductView, Shop } from '@/lib/types';

export const toDay = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
export const dayStart = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : null);
export const dayEnd = (d: string) => (d ? new Date(`${d}T23:59:59`).toISOString() : null);
export const isDayOrEmpty = (d: string) => d === '' || /^\d{4}-\d{2}-\d{2}$/.test(d);

/** Where a button goes: a ready-made page, a shop, a category, or a custom link. (Same links as the website.) */
export function LinkSelect({ label, value, onChange, shops, cats }: { label: string; value: string; onChange: (v: string) => void; shops: Shop[]; cats: Category[] }) {
  const presets: { value: string; label: string }[] = [{ value: '', label: 'No link' }, { value: '/products', label: 'All products' }, { value: '/shops', label: 'All shops' },
    ...cats.map((c) => ({ value: `/products?category=${c.id}`, label: `Category: ${c.name}` })), ...shops.map((s) => ({ value: `/shops/${s.id}`, label: `Shop page: ${s.name}` }))];
  const [custom, setCustom] = useState(() => !presets.some((p) => p.value === value));
  return (
    <View style={{ gap: 8 }}>
      <Select label={label} value={custom ? '__custom' : value} onChange={(v) => { if (v === '__custom') { setCustom(true); onChange(''); } else { setCustom(false); onChange(v); } }} options={[...presets, { value: '__custom', label: 'Custom link…' }]} />
      {custom && <Field value={value} onChangeText={onChange} placeholder="/products?sort=latest or https://…" autoCapitalize="none" error={!isValidLink(value) ? 'Use a path like /products or an address starting with https://' : undefined} />}
    </View>
  );
}

export function ScheduleFields({ start, end, active, onStart, onEnd, onActive }: { start: string; end: string; active: boolean; onStart: (v: string) => void; onEnd: (v: string) => void; onActive: (v: boolean) => void }) {
  return (
    <View style={{ gap: 10 }}>
      <Row style={{ gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Show from (optional)" value={start} onChangeText={onStart} placeholder="YYYY-MM-DD" error={!isDayOrEmpty(start) ? 'YYYY-MM-DD' : undefined} /></View>
        <View style={{ flex: 1 }}><Field label="Hide after (optional)" value={end} onChangeText={onEnd} placeholder="YYYY-MM-DD" error={!isDayOrEmpty(end) ? 'YYYY-MM-DD' : undefined} /></View>
      </Row>
      <Check checked={active} onChange={onActive}><Txt>Active (visible to customers)</Txt></Check>
    </View>
  );
}

/** Pick products in order. */
export function ProductPicker({ value, onChange, max }: { value: string[]; onChange: (ids: string[]) => void; max: number }) {
  const all = useQuery(listAllProducts);
  const [open, setOpen] = useState(false); const [q, setQ] = useState('');
  const byId = useMemo(() => new Map((all.data ?? []).map((p) => [p.id, p])), [all.data]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (all.data ?? []).filter((p) => !value.includes(p.id) && (!t || `${p.name} ${p.shop_name} ${p.code}`.toLowerCase().includes(t))).slice(0, 30);
  }, [all.data, q, value]);
  const move = (i: number, d: number) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <View style={{ gap: 8 }}>
      {value.length === 0 ? <Txt v="small">No products picked yet.</Txt> : value.map((id, i) => {
        const p: ProductView | undefined = byId.get(id);
        return (
          <Row key={id} style={{ borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 8, backgroundColor: C.white }}>
            <Txt v="tiny" style={{ width: 16 }}>{i + 1}</Txt>
            <View style={{ flex: 1 }}><Txt numberOfLines={1} bold>{p ? p.name : 'Deleted product'}</Txt>{p && <Txt v="tiny">{p.shop_name} · {rs(p.final_price)}</Txt>}</View>
            <Button title="↑" small variant="outline" onPress={() => move(i, -1)} disabled={i === 0} /><Button title="↓" small variant="outline" onPress={() => move(i, 1)} disabled={i === value.length - 1} /><Button title="✕" small variant="outline" onPress={() => onChange(value.filter((x) => x !== id))} />
          </Row>
        );
      })}
      {value.length < max ? <Button title="Add products" variant="outline" icon="add-circle-outline" onPress={() => setOpen(true)} /> : <Txt v="tiny">You can pick up to {max} products here.</Txt>}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Add products">
        <Field value={q} onChangeText={setQ} placeholder="Search product, shop or code" autoCapitalize="none" />
        {all.loading ? <Txt v="small">Loading products…</Txt> : results.length === 0 ? <Txt v="small">No matching products.</Txt> : results.map((p) => (
          <Row key={p.id} style={{ borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8 }}>
            <View style={{ flex: 1 }}><Txt numberOfLines={1}>{p.name}</Txt><Txt v="tiny">{p.shop_name} · {rs(p.final_price)}</Txt></View>
            <Button title="Add" small disabled={value.length >= max} onPress={() => { onChange([...value, p.id]); if (value.length + 1 >= max) setOpen(false); }} />
          </Row>
        ))}
      </Sheet>
    </View>
  );
}
