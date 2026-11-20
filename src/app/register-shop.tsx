import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { usePlatform } from '@/context/platform';
import { registerShop } from '@/services/shops';
import { TermsBox } from '@/components/TermsBox';
import { Button, Card, Field, Screen, Txt } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { C } from '@/lib/theme';

export default function RegisterShop() {
  const router = useRouter(); const { refresh } = useAuth(); const toast = useToast(); const { pct, rate } = usePlatform();
  const [f, setF] = useState({ owner_name: '', email: '', password: '', shop_name: '', city: '', phone: '', description: '' });
  const [agreed, setAgreed] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const submit = async () => {
    if (Object.values(f).some((v) => !v.trim())) { setErr('Fill in all the fields.'); return; }
    if (!agreed) { setErr('Please accept the Terms & Conditions to continue.'); return; }
    setBusy(true); setErr('');
    try { await registerShop(f); await refresh(); toast('Shop submitted. We will review it shortly.'); router.replace('/shop'); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <Screen>
      <Txt v="small">Add your clothing, receive cash-on-delivery orders and keep {+(100 - rate * 100).toFixed(2)}% of every delivered sale. We only charge {pct} commission when an order is delivered. The first 6 months have no fees.</Txt>
      <Card>
        <Field label="Your name" value={f.owner_name} onChangeText={set('owner_name')} autoCapitalize="words" />
        <Field label="Shop name" value={f.shop_name} onChangeText={set('shop_name')} autoCapitalize="words" />
        <Field label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" />
        <Field label="Password" value={f.password} onChangeText={set('password')} secure hint="At least 6 characters." />
        <Field label="Mobile number" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="City" value={f.city} onChangeText={set('city')} autoCapitalize="words" />
        <Field label="What do you sell?" value={f.description} onChangeText={set('description')} multiline />
        <TermsBox kind="shop" checked={agreed} onChange={setAgreed} />
        {err ? <Txt color={C.crimson}>{err}</Txt> : null}
        <Button title="Submit shop for approval" loading={busy} disabled={!agreed} onPress={submit} />
      </Card>
      <Txt v="tiny" center>{BRAND.name}</Txt>
    </Screen>
  );
}
