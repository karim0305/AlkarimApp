import React from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@/hooks/useQuery';
import { usePlatform } from '@/context/platform';
import { adminOverview } from '@/services/analytics';
import { ErrorBox, Grid, Loading, Row, Screen, StatCard, Txt } from '@/components/ui';
import { C } from '@/lib/theme';
import { rs } from '@/lib/format';

function Alert({ n, text, tone, onPress }: { n: number; text: string; tone: string; onPress: () => void }) {
  if (n <= 0) return null;
  return <Pressable onPress={onPress} style={{ backgroundColor: tone + '1A', borderColor: tone, borderWidth: 1, borderRadius: 12, padding: 12 }}><Row><Ionicons name="alert-circle" size={20} color={tone} /><Txt style={{ flex: 1 }}><Txt bold>{n}</Txt> {text}</Txt><Ionicons name="chevron-forward" size={18} color={tone} /></Row></Pressable>;
}

/** Minimum statistics: just the numbers the admin checks every day, plus what needs action. */
export default function AdminHome() {
  const router = useRouter(); const { pct } = usePlatform();
  const q = useQuery(adminOverview);
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const d = q.data!;
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      <Alert n={d.toRefer} text={`new order${d.toRefer > 1 ? 's are' : ' is'} waiting to be referred to a shop.`} tone={C.crimson} onPress={() => router.push('/admin/orders')} />
      <Alert n={d.attention} text={`order${d.attention > 1 ? 's need' : ' needs'} a delivery check.`} tone={C.goldDark} onPress={() => router.push('/admin/orders')} />
      <Alert n={d.pendingShops} text={`shop${d.pendingShops > 1 ? 's are' : ' is'} waiting for approval.`} tone={C.indigo} onPress={() => router.push('/admin/shops')} />
      <Grid>
        <StatCard label="Shops" value={`${d.activeShops}/${d.shops}`} hint="Active / total" />
        <StatCard label="Customers" value={d.customers} />
        <StatCard label="Products" value={d.products} />
        <StatCard label="Orders" value={d.totalOrders} hint={`${d.delivered} delivered`} />
        <StatCard label="Total sales" value={rs(d.sales)} hint="Delivered orders" tone={C.green} />
        <StatCard label={`Revenue (${pct})`} value={rs(d.commission)} hint="Commission" tone={C.crimson} />
      </Grid>
    </Screen>
  );
}
