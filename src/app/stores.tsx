import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@/hooks/useQuery';
import { listShops } from '@/services/shops';
import { Card, Empty, ErrorBox, Loading, Row, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';

export function ShopTile({ id, name, city, count, desc }: { id: string; name: string; city: string; count: number; desc?: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/store/${id}`)}>
      <Card>
        <Row><View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: C.indigo, alignItems: 'center', justifyContent: 'center' }}><Txt v="h2" color={C.gold}>{name[0]}</Txt></View>
          <View style={{ flex: 1 }}><Txt v="h3">{name}</Txt><Row style={{ gap: 4 }}><Ionicons name="location-outline" size={13} color={C.muted} /><Txt v="small">{city} · {count} products</Txt></Row></View></Row>
        {desc ? <Txt v="small" numberOfLines={2}>{desc}</Txt> : null}
      </Card>
    </Pressable>
  );
}

export default function Stores() {
  const q = useQuery(() => listShops({ activeOnly: true }));
  if (q.loading) return <Loading full />;
  if (q.error) return <Screen><ErrorBox message={q.error} retry={q.reload} /></Screen>;
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      <Txt v="small">Every shop is reviewed before it can sell.</Txt>
      {(q.data ?? []).length === 0 ? <Empty title="No shops yet" /> : (q.data ?? []).map((s) => <ShopTile key={s.id} id={s.id} name={s.name} city={s.city} count={s.product_count} desc={s.description} />)}
    </Screen>
  );
}
