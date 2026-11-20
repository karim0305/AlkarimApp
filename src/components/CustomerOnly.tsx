import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { Button, Card, Row, Txt } from './ui';
import { blockedMessage } from '@/lib/roles';
import { C } from '@/lib/theme';
import type { Role } from '@/lib/types';

/** Shown to a shop owner or admin who tries to order. Orders are for customer accounts only. */
export function CustomerOnlyNotice({ role, next = '/cart' }: { role: Role; next?: string }) {
  const { logout } = useAuth(); const router = useRouter();
  return (
    <Card style={{ backgroundColor: C.gold50, borderColor: C.gold }}>
      <Row style={{ alignItems: 'flex-start' }}><Ionicons name="person-circle-outline" size={26} color={C.goldDark} /><Txt style={{ flex: 1 }}>{blockedMessage(role)}</Txt></Row>
      <Button title="Log out and log in as customer" small onPress={async () => { await logout(); router.replace(`/login?next=${encodeURIComponent(next)}`); }} />
    </Card>
  );
}
