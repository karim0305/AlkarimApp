import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { registerCustomer } from '@/services/auth';
import { TermsBox } from '@/components/TermsBox';
import { Button, Card, Field, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';

export default function Register() {
  const router = useRouter(); const { refresh } = useAuth(); const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [agreed, setAgreed] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const submit = async () => {
    if (!f.name.trim() || !f.email.trim() || !f.phone.trim()) { setErr('Fill in all the fields.'); return; }
    if (!agreed) { setErr('Please accept the Terms & Conditions to continue.'); return; }
    setBusy(true); setErr('');
    try { await registerCustomer(f.name.trim(), f.email, f.phone.trim(), f.password); await refresh(); toast('Account created. Happy shopping!'); router.replace('/'); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <Screen>
      <Card>
        <Field label="Full name" value={f.name} onChangeText={set('name')} autoCapitalize="words" />
        <Field label="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" />
        <Field label="Mobile number" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="0300 1234567" />
        <Field label="Password" value={f.password} onChangeText={set('password')} secure hint="At least 6 characters." />
        <TermsBox kind="customer" checked={agreed} onChange={setAgreed} />
        {err ? <Txt color={C.crimson}>{err}</Txt> : null}
        <Button title="Create account" loading={busy} disabled={!agreed} onPress={submit} />
      </Card>
      <Txt center v="small">Already registered? <Txt v="small" bold color={C.crimson} onPress={() => router.replace('/login')}>Log in</Txt></Txt>
    </Screen>
  );
}
