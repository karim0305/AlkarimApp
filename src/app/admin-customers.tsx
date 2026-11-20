import React from 'react';
import { useQuery } from '@/hooks/useQuery';
import { listCustomers } from '@/services/analytics';
import { Button, Card, Empty, ErrorBox, KV, Loading, Screen, Txt } from '@/components/ui';
import { callPhone } from '@/lib/links';
import { rs } from '@/lib/format';

export default function AdminCustomers() {
  const q = useQuery(listCustomers);
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      {(q.data ?? []).length === 0 ? <Empty title="No customers yet" /> : (q.data ?? []).map((c) => (
        <Card key={c.id}><Txt v="h3">{c.name}</Txt><KV k="Email" v={c.email} />{c.phone ? <KV k="Mobile" v={c.phone} /> : null}<KV k="Orders" v={String(c.orders)} /><KV k="Delivered spend" v={rs(c.spent)} />{c.phone ? <Button title="Call" small variant="outline" icon="call-outline" onPress={() => callPhone(c.phone!)} /> : null}</Card>
      ))}
    </Screen>
  );
}
