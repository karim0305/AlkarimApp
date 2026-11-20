import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useCart } from '@/context/cart';
import { BrandLogo } from '@/components/shared';
import { Button, Card, KV, Loading, Screen, Txt } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { callPhone } from '@/lib/links';

export default function Account() {
  const { user, ready, logout } = useAuth(); const cart = useCart(); const router = useRouter();
  if (!ready) return <Loading full />;
  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingVertical: 12 }}><BrandLogo /></View>
      {user ? (
        <Card>
          <Txt v="h2">{user.name}</Txt>
          <KV k="Email" v={user.email} />
          {user.phone ? <KV k="Mobile" v={user.phone} /> : null}
          <Button title="Log out" variant="outline" onPress={async () => { await logout(); cart.clear(); router.replace('/'); }} />
        </Card>
      ) : (
        <Card>
          <Txt v="h2">Welcome</Txt>
          <Txt v="small">Log in to place orders, track them and write reviews.</Txt>
          <Button title="Log in" onPress={() => router.push('/login')} />
          <Button title="Create account" variant="outline" onPress={() => router.push('/register')} />
        </Card>
      )}
      <Card>
        <Txt v="h3">Sell with us</Txt>
        <Txt v="small">Open your own shop on {BRAND.name}. We only charge commission on delivered orders.</Txt>
        <Button title="Open a shop" variant="gold" onPress={() => router.push('/register-shop')} />
        <Button title="Shop log in" variant="ghost" onPress={() => router.push('/login')} />
      </Card>
      <Card>
        <Button title="All shops" variant="outline" onPress={() => router.push('/stores')} />
        <Button title="Terms & Conditions" variant="outline" onPress={() => router.push('/terms')} />
        <Button title={`Call ${BRAND.phone}`} variant="ghost" icon="call-outline" onPress={() => callPhone(BRAND.phone)} />
        <Txt v="tiny" center>{BRAND.email}</Txt>
      </Card>
    </Screen>
  );
}
