import React from 'react';
import { Card, Screen, Txt } from '@/components/ui';
import { TERMS_SECTIONS } from '@/lib/termsContent';
import { TERMS_UPDATED, TERMS_VERSION } from '@/lib/terms';
import { C } from '@/lib/theme';

export default function Terms() {
  return (
    <Screen>
      <Txt v="small">Version {TERMS_VERSION} · Last updated {TERMS_UPDATED}</Txt>
      <Card style={{ backgroundColor: C.indigo50, borderColor: C.indigo100 }}><Txt><Txt bold>In short: </Txt>We advertise shops’ products. The sale, the product and the delivery are between you and the shop. If something goes wrong with a product, delivery or payment, you deal with the shop. We are not responsible for it.</Txt></Card>
      {TERMS_SECTIONS.map((s, i) => (
        <Card key={s.title}>
          <Txt v="h3">{i + 1}. {s.title}</Txt>
          {s.body.map((p) => <Txt key={p}>{p}</Txt>)}
        </Card>
      ))}
    </Screen>
  );
}
