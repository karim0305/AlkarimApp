import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@/hooks/useQuery';
import { useConfirm, useToast } from '@/context/toast';
import { listShops, setShopStatus } from '@/services/shops';
import { Badge, Button, Card, Empty, ErrorBox, KV, Loading, Row, Screen, Txt } from '@/components/ui';
import { shortDate } from '@/lib/format';
import type { ShopStatus } from '@/lib/types';

export default function AdminShops() {
  const q = useQuery(() => listShops()); const confirm = useConfirm(); const toast = useToast();
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const act = async (id: string, name: string, status: ShopStatus, verb: string) => {
    const ok = await confirm({ title: `${verb} ${name}?`, message: status === 'active' ? 'The shop and its products become visible to customers.' : status === 'rejected' ? 'The owner is told the registration was rejected.' : 'Its products disappear from the marketplace. Existing orders stay open.', confirmLabel: verb, danger: status !== 'active' });
    if (!ok) return;
    try { await setShopStatus(id, status); toast(`${name}: ${verb.toLowerCase()} done.`); } catch (x) { toast((x as Error).message, 'error'); }
  };
  const list = [...(q.data ?? [])].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0));
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      {list.length === 0 ? <Empty title="No shops yet" /> : list.map((s) => (
        <Card key={s.id}>
          <Row style={{ justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Txt v="h3">{s.name}</Txt><Txt v="small">{s.city} · code {s.shop_code}</Txt></View><Badge status={s.status} /></Row>
          <KV k="Phone" v={s.phone ?? '–'} /><KV k="Products" v={String(s.product_count)} /><KV k="Joined" v={shortDate(s.created_at)} />
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            {s.status === 'pending' && <><Button title="Approve" small onPress={() => act(s.id, s.name, 'active', 'Approve')} /><Button title="Reject" variant="outline" small onPress={() => act(s.id, s.name, 'rejected', 'Reject')} /></>}
            {s.status === 'active' && <Button title="Deactivate" variant="outline" small onPress={() => act(s.id, s.name, 'inactive', 'Deactivate')} />}
            {(s.status === 'inactive' || s.status === 'rejected') && <Button title="Activate" small onPress={() => act(s.id, s.name, 'active', 'Activate')} />}
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
