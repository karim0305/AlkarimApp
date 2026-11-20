import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { login } from '@/services/auth';
import { Button, Card, Field, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';

export default function Login() {
  const { next, reset } = useLocalSearchParams<{ next?: string; reset?: string }>();
  const router = useRouter(); const { refresh } = useAuth(); const toast = useToast();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) { setErr('Enter your email and password.'); return; }
    setBusy(true); setErr('');
    try {
      const u = await login(email, password); await refresh();
      toast(`Welcome back, ${u.name.split(' ')[0]}.`);
      router.replace(u.role === 'admin' ? '/admin' : u.role === 'shop' ? '/shop' : next ? decodeURIComponent(next) : '/');
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <Screen>
      {reset ? <View style={{ backgroundColor: C.green50, padding: 12, borderRadius: 10 }}><Txt color={C.green}>Your password was changed. Log in with your new password.</Txt></View> : null}
      <Card>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} secure />
        <Txt v="small" color={C.crimson} bold style={{ alignSelf: 'flex-end' }} onPress={() => router.push('/forgot-password')}>Forgot password?</Txt>
        {err ? <Txt color={C.crimson}>{err}</Txt> : null}
        <Button title="Log in" loading={busy} onPress={submit} />
      </Card>
      <Txt center v="small">New here? <Txt v="small" bold color={C.crimson} onPress={() => router.push('/register')}>Create an account</Txt> or <Txt v="small" bold color={C.crimson} onPress={() => router.push('/register-shop')}>open a shop</Txt></Txt>
    </Screen>
  );
}
