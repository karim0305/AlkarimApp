import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useMyShop } from '@/hooks/useMyShop';
import { MenuItem } from '@/components/MenuItem';
import { Badge, Button, Card, Divider, KV, Row, Screen, Txt } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { callPhone } from '@/lib/links';

export default function ShopMore() {
  const { user, logout } = useAuth(); const { shop } = useMyShop(); const router = useRouter();
  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><Txt v="h2">{shop?.name}</Txt>{shop ? <Badge status={shop.status} /> : null}</Row>
        <KV k="Owner" v={user?.name ?? ''} /><KV k="Email" v={user?.email ?? ''} />{shop ? <KV k="Shop code" v={shop.shop_code} /> : null}
      </Card>
      <Card>
        <MenuItem icon="star-outline" label="Reviews" onPress={() => router.push('/shop-reviews')} /><Divider />
        <MenuItem icon="storefront-outline" label="Shop profile & delivery charges" onPress={() => router.push('/shop-profile')} /><Divider />
        <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push('/terms')} /><Divider />
        <MenuItem icon="call-outline" label={`Support ${BRAND.phone}`} onPress={() => callPhone(BRAND.phone)} />
      </Card>
      <Button title="Log out" variant="outline" onPress={async () => { await logout(); router.replace('/'); }} />
    </Screen>
  );
}
