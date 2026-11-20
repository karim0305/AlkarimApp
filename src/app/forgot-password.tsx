import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { useToast } from '@/context/toast';
import { cancelPasswordReset, completePasswordReset, requestPasswordReset, verifyResetCode } from '@/services/auth';
import { Button, Card, Field, Row, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';

type Step = 'email' | 'code' | 'password' | 'done';
const STEPS: [Step, string][] = [['email', 'Email'], ['code', 'Code'], ['password', 'New password']];
const MAX_TRIES = 5;

/** Same for admin, shop owner and customer: email -> 6-digit code -> new password -> log in again. */
export default function ForgotPassword() {
  const router = useRouter(); const toast = useToast(); const { refresh } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [wait, setWait] = useState(0); const [tries, setTries] = useState(0);
  const verified = useRef(false); const finished = useRef(false);

  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  // Leaving after the code was accepted but before choosing a password must not leave the person logged in
  useEffect(() => () => { if (verified.current && !finished.current) void cancelPasswordReset(); }, []);

  const sendCode = async () => {
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Enter a valid email address.'); return; }
    setBusy(true);
    try { await requestPasswordReset(email); setCode(''); setTries(0); setStep('code'); setWait(60); toast('If this email has an account, we sent a 6-digit code to it.', 'info'); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };
  const checkCode = async () => {
    setErr('');
    if (!/^\d{6,8}$/.test(code.trim())) { setErr('Enter the code from your email (digits only).'); return; }
    setBusy(true);
    try { await verifyResetCode(email, code); verified.current = true; setStep('password'); }
    catch (x) {
      const n = tries + 1; setTries(n);
      if (n >= MAX_TRIES) { setStep('email'); setErr('Too many wrong codes. Ask for a new code.'); } else setErr(`${(x as Error).message} (${MAX_TRIES - n} tries left)`);
    }
    setBusy(false);
  };
  const savePassword = async () => {
    setErr('');
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { setErr('The two passwords do not match.'); return; }
    setBusy(true);
    try { await completePasswordReset(pw); finished.current = true; await refresh(); setStep('done'); setTimeout(() => router.replace('/login?reset=1'), 2200); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };

  const idx = STEPS.findIndex(([s]) => s === step);
  return (
    <Screen>
      {step !== 'done' && (
        <View style={{ flexDirection: 'row', gap: 8 }}>{STEPS.map(([s, l], i) => <View key={s} style={{ flex: 1, gap: 4 }}><View style={{ height: 5, borderRadius: 3, backgroundColor: i <= idx ? C.indigo : '#E2E8F0' }} /><Txt v="tiny" color={i <= idx ? C.indigo : C.faint} bold={i <= idx}>{i + 1}. {l}</Txt></View>)}</View>
      )}
      {step === 'email' && (
        <Card>
          <Row style={{ alignItems: 'flex-start' }}><Ionicons name="mail-outline" size={24} color={C.indigo} /><Txt v="small" style={{ flex: 1 }}>Enter the email you log in with. We will send you a 6-digit code.</Txt></Row>
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoFocus />
          {err ? <Txt color={C.crimson}>{err}</Txt> : null}
          <Button title="Send code" loading={busy} onPress={sendCode} />
          <Button title="Back to log in" variant="ghost" onPress={() => router.replace('/login')} />
        </Card>
      )}
      {step === 'code' && (
        <Card>
          <Row style={{ alignItems: 'flex-start' }}><Ionicons name="shield-checkmark-outline" size={24} color={C.indigo} /><Txt v="small" style={{ flex: 1 }}>If {email} has an account, a 6-digit code is on its way. Check your inbox and spam folder.</Txt></Row>
          <Field label="6-digit code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={8} autoFocus />
          {err ? <Txt color={C.crimson}>{err}</Txt> : null}
          <Button title="Confirm code" loading={busy} onPress={checkCode} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt v="small" bold color={wait > 0 || busy ? C.faint : C.crimson} onPress={wait > 0 || busy ? undefined : sendCode}>{wait > 0 ? `Send again in ${wait}s` : 'Send a new code'}</Txt>
            <Txt v="small" onPress={() => { setStep('email'); setErr(''); }}>Change email</Txt>
          </Row>
        </Card>
      )}
      {step === 'password' && (
        <Card>
          <Row style={{ alignItems: 'flex-start' }}><Ionicons name="key-outline" size={24} color={C.green} /><Txt v="small" style={{ flex: 1 }}>Code confirmed. Choose a new password.</Txt></Row>
          <Field label="New password" value={pw} onChangeText={setPw} secure autoFocus hint="At least 6 characters." />
          <Field label="Confirm password" value={pw2} onChangeText={setPw2} secure error={pw2 && pw !== pw2 ? 'The passwords do not match.' : undefined} />
          {err ? <Txt color={C.crimson}>{err}</Txt> : null}
          <Button title="Change password" loading={busy} onPress={savePassword} />
        </Card>
      )}
      {step === 'done' && (
        <Card style={{ alignItems: 'center', padding: 28 }}>
          <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
          <Txt v="h2">Password changed</Txt>
          <Txt v="small" center>Now log in with your email and your new password.</Txt>
          <Button title="Go to log in" onPress={() => router.replace('/login?reset=1')} />
        </Card>
      )}
    </Screen>
  );
}
