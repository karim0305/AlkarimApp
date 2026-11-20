import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';

export default function OrderSuccess() {
  const { no } = useLocalSearchParams<{ no?: string }>(); const router = useRouter();
  const nos = (no ?? '').split(',').filter(Boolean);
  return (
    <Screen style={{ alignItems: 'center', paddingTop: 36 }}>
      <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
      <Txt v="title" center>Order placed successfully</Txt>
      <Txt v="small" center>{nos.length > 1 ? 'Your items come from different shops, so we created one order per shop.' : 'The shop will confirm it shortly.'}</Txt>
      {nos.map((n) => <Card key={n} style={{ alignSelf: 'stretch', alignItems: 'center', borderStyle: 'dashed', borderColor: C.indigo, backgroundColor: C.indigo50 }}><Txt v="small">Order number</Txt><Txt v="h2">{n}</Txt></Card>)}
      <Txt v="small" center>Keep your cash ready. You’ll pay the rider when it arrives.</Txt>
      <Button title="View my orders" style={{ alignSelf: 'stretch' }} onPress={() => router.replace('/orders')} />
      <Button title="Continue shopping" variant="outline" style={{ alignSelf: 'stretch' }} onPress={() => router.replace('/')} />
    </Screen>
  );
}
