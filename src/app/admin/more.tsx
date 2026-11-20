import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { MenuItem } from '@/components/MenuItem';
import { Button, Card, Divider, KV, Screen, Txt } from '@/components/ui';

export default function AdminMore() {
  const { user, logout } = useAuth(); const router = useRouter();
  return (
    <Screen>
      <Card><Txt v="h2">{user?.name}</Txt><KV k="Email" v={user?.email ?? ''} /></Card>
      <Card>
        <MenuItem icon="shirt-outline" label="Products" onPress={() => router.push('/admin-products')} /><Divider />
        <MenuItem icon="pricetags-outline" label="Categories" onPress={() => router.push('/admin-categories')} /><Divider />
        <MenuItem icon="people-outline" label="Customers" onPress={() => router.push('/admin-customers')} /><Divider />
        <MenuItem icon="star-outline" label="Reviews" onPress={() => router.push('/admin-reviews')} /><Divider />
        <MenuItem icon="color-palette-outline" label="Homepage (banners, announcements, rows)" onPress={() => router.push('/admin-homepage')} /><Divider />
        <MenuItem icon="settings-outline" label="Settings (commission)" onPress={() => router.push('/admin-settings')} />
      </Card>
      <Button title="Log out" variant="outline" onPress={async () => { await logout(); router.replace('/'); }} />
    </Screen>
  );
}
