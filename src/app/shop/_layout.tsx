import React from 'react';
import type { ColorValue } from 'react-native';
import { View } from 'react-native';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { useMyShop } from '@/hooks/useMyShop';
import { BrandLogo } from '@/components/shared';
import { Button, Card, Loading, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: Icon, focused: Icon) => ({ color, size, focused: f }: { color: ColorValue; size: number; focused: boolean }) => <Ionicons name={f ? focused : name} size={size} color={color as string} />;
const COPY = {
  pending: ['time-outline', 'Your shop is waiting for approval', 'We are reviewing your registration. You will get access to your dashboard as soon as an admin approves it.'],
  rejected: ['ban-outline', 'Your shop registration was rejected', 'Your dashboard stays locked. Contact support if you think this is a mistake.'],
  inactive: ['ban-outline', 'Your shop is deactivated', 'An admin has switched your shop off, so the dashboard is locked and customers cannot see your products. Contact support to get it reactivated.'],
  missing: ['storefront-outline', 'No shop found for this account', 'This account is not linked to a shop. Register a shop or log in with the right email.'],
} as const;

/** Shop owner panel. Only an approved (active) shop can open it. */
export default function ShopTabs() {
  const { user, ready, logout } = useAuth(); const router = useRouter(); const { shop, loading, reload } = useMyShop();
  if (!ready) return <Loading full />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'shop') return <Redirect href={user.role === 'admin' ? '/admin' : '/'} />;
  if (loading) return <Loading full />;
  if (shop?.status !== 'active') {
    const c = COPY[shop ? (shop.status as 'pending') : 'missing'];
    return (
      <Screen style={{ justifyContent: 'center', flexGrow: 1 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}><BrandLogo /></View>
        <Card style={{ alignItems: 'center', padding: 24 }}>
          <Ionicons name={c[0]} size={44} color={C.goldDark} />
          <Txt v="h2" center>{c[1]}</Txt>
          {shop ? <Txt bold>{shop.name}</Txt> : null}
          <Txt v="small" center>{c[2]}</Txt>
          {shop?.status === 'pending' && <Button title="Check approval status" onPress={reload} />}
          <Button title="Log out" variant="outline" onPress={async () => { await logout(); router.replace('/'); }} />
        </Card>
      </Screen>
    );
  }
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: C.indigo, tabBarInactiveTintColor: C.faint, headerStyle: { backgroundColor: C.white }, headerShadowVisible: false, headerTitleStyle: { fontWeight: '700', color: C.indigoDark } }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', headerTitle: shop.name, tabBarIcon: icon('grid-outline', 'grid') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', headerTitle: 'Incoming orders', tabBarIcon: icon('receipt-outline', 'receipt') }} />
      <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: icon('shirt-outline', 'shirt') }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments', headerTitle: 'Commission payments', tabBarIcon: icon('cash-outline', 'cash') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('menu-outline', 'menu') }} />
    </Tabs>
  );
}
