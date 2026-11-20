import React from 'react';
import type { ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { useCart } from '@/context/cart';
import { Loading } from '@/components/ui';
import { C } from '@/lib/theme';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: Icon, focused: Icon) => ({ color, size, focused: f }: { color: ColorValue; size: number; focused: boolean }) => <Ionicons name={f ? focused : name} size={size} color={color as string} />;

/** Customer app: Home, Shop, Cart, Orders, Account. Shop owners and the admin are sent to their own panels. */
export default function CustomerTabs() {
  const { user, ready } = useAuth(); const cart = useCart();
  if (!ready) return <Loading full />;
  if (user?.role === 'shop') return <Redirect href="/shop" />;
  if (user?.role === 'admin') return <Redirect href="/admin" />;
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: C.indigo, tabBarInactiveTintColor: C.faint, headerStyle: { backgroundColor: C.white }, headerShadowVisible: false, headerTitleStyle: { fontWeight: '700', color: C.indigoDark }, tabBarLabelStyle: { fontWeight: '600', fontSize: 11 } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="browse" options={{ title: 'Shop', headerTitle: 'Browse clothing', tabBarIcon: icon('search-outline', 'search') }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', headerTitle: 'Your cart', tabBarBadge: cart.count > 0 ? cart.count : undefined, tabBarBadgeStyle: { backgroundColor: C.crimson }, tabBarIcon: icon('bag-outline', 'bag') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', headerTitle: 'My orders', tabBarIcon: icon('receipt-outline', 'receipt') }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
