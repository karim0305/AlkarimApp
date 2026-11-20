import React, { useEffect, useState } from 'react';
import { useConfirm, useToast } from '@/context/toast';
import { usePlatform } from '@/context/platform';
import { updateCommissionRate } from '@/services/settings';
import { Button, Card, Field, Screen, Txt } from '@/components/ui';
import { C } from '@/lib/theme';
import { rs } from '@/lib/format';

/** The commission the platform charges shops. Stored in the database and used when an order is delivered. */
export default function AdminSettings() {
  const { rate, pct } = usePlatform(); const toast = useToast(); const confirm = useConfirm();
  const [v, setV] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setV(String(+(rate * 100).toFixed(2))); }, [rate]);
  const n = Number(v); const valid = v.trim() !== '' && n >= 0 && n <= 50; const fee = valid ? Math.round(5000 * (n / 100)) : 0;
  const save = async () => {
    if (!valid) { toast('Enter a percentage between 0 and 50.', 'error'); return; }
    if (!(await confirm({ title: `Change commission to ${n}%?`, message: 'It applies to orders delivered from now on. Orders already delivered keep the rate they were delivered at.', confirmLabel: 'Save commission' }))) return;
    setBusy(true);
    try { await updateCommissionRate(Math.round(n * 100) / 10000); toast(`Commission is now ${n}%.`); } catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  return (
    <Screen>
      <Card>
        <Txt v="h3">Platform commission</Txt>
        <Txt v="small">Charged to shops on the product value of delivered orders. Current rate: <Txt v="small" bold>{pct}</Txt>.</Txt>
        <Field label="Commission (%)" value={v} onChangeText={setV} keyboardType="decimal-pad" />
        {valid && <Txt v="small" style={{ backgroundColor: C.indigo50, padding: 10, borderRadius: 10 }}>On an order of {rs(5000)}: commission <Txt v="small" bold>{rs(fee)}</Txt>, shop earns <Txt v="small" bold>{rs(5000 - fee)}</Txt>.</Txt>}
        <Button title="Save commission" loading={busy} disabled={!valid} onPress={save} />
      </Card>
    </Screen>
  );
}
