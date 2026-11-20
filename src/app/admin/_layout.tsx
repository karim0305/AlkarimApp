import React from 'react';
import type { ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { Loading } from '@/components/ui';
import { C } from '@/lib/theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: Icon, focused: Icon) => ({ color, size, focused: f }: { color: ColorValue; size: number; focused: boolean }) => <Ionicons name={f ? focused : name} size={size} color={color as string} />;

/** Admin panel. Only an admin account can open it. */
export default function AdminTabs() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading full />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'admin') return <Redirect href={user.role === 'shop' ? '/shop' : '/'} />;
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: C.indigo, tabBarInactiveTintColor: C.faint, headerStyle: { backgroundColor: C.white }, headerShadowVisible: false, headerTitleStyle: { fontWeight: '700', color: C.indigoDark } }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', headerTitle: 'Admin', tabBarIcon: icon('grid-outline', 'grid') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('receipt-outline', 'receipt') }} />
      <Tabs.Screen name="shops" options={{ title: 'Shops', tabBarIcon: icon('storefront-outline', 'storefront') }} />
      <Tabs.Screen name="commissions" options={{ title: 'Commission', tabBarIcon: icon('cash-outline', 'cash') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('menu-outline', 'menu') }} />
    </Tabs>
  );
}
