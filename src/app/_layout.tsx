import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/context/toast';
import { AuthProvider } from '@/context/auth';
import { PlatformProvider } from '@/context/platform';
import { CartProvider } from '@/context/cart';
import { C } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <PlatformProvider>
            <CartProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerStyle: { backgroundColor: C.white }, headerTintColor: C.indigo, headerTitleStyle: { fontWeight: '700', color: C.indigoDark }, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: C.surface } }}>
                <Stack.Screen name="(customer)" options={{ headerShown: false }} />
                <Stack.Screen name="shop" options={{ headerShown: false }} />
                <Stack.Screen name="admin" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ title: 'Log in' }} />
                <Stack.Screen name="register" options={{ title: 'Create account' }} />
                <Stack.Screen name="register-shop" options={{ title: 'Open your shop' }} />
                <Stack.Screen name="forgot-password" options={{ title: 'Forgot password' }} />
                <Stack.Screen name="terms" options={{ title: 'Terms & Conditions' }} />
                <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
                <Stack.Screen name="store/[id]" options={{ title: 'Shop' }} />
                <Stack.Screen name="stores" options={{ title: 'Shops' }} />
                <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
                <Stack.Screen name="order-success" options={{ title: 'Order placed', headerBackVisible: false }} />
                <Stack.Screen name="shop-product/[id]" options={{ title: 'Product' }} />
                <Stack.Screen name="shop-reviews" options={{ title: 'Reviews' }} />
                <Stack.Screen name="shop-profile" options={{ title: 'Shop profile & delivery' }} />
                <Stack.Screen name="admin-products" options={{ title: 'Products' }} />
                <Stack.Screen name="admin-categories" options={{ title: 'Categories' }} />
                <Stack.Screen name="admin-customers" options={{ title: 'Customers' }} />
                <Stack.Screen name="admin-reviews" options={{ title: 'Reviews' }} />
                <Stack.Screen name="admin-homepage" options={{ title: 'Homepage' }} />
                <Stack.Screen name="admin-settings" options={{ title: 'Settings' }} />
              </Stack>
            </CartProvider>
          </PlatformProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
