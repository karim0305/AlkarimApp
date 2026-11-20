import React from 'react';
import { useRouter } from 'expo-router';
import { usePlatform } from '@/context/platform';
import { Card, Check, Txt } from './ui';
import { C } from '@/lib/theme';

const CUSTOMER = [
  'Al Karim Styloes is an advertising platform. Products are sold and delivered by the shops, not by us.',
  'If you receive a wrong, damaged or faulty item, contact the shop directly. We are not responsible for product quality, delivery or refunds.',
  'Orders are cash on delivery. If you refuse an order or don’t pay, the shop or its delivery company deals with you directly, and your account may be blocked.',
];

/** Compulsory “I agree” box for registration (customer and shop). */
export function TermsBox({ checked, onChange, kind }: { checked: boolean; onChange: (v: boolean) => void; kind: 'customer' | 'shop' }) {
  const { pct } = usePlatform(); const router = useRouter();
  const points = kind === 'customer' ? CUSTOMER : [
    'We only advertise your products. You are responsible for everything you list and send: genuine, legal and as described.',
    'If you send a wrong or faulty product, you deal with the customer. We are not liable.',
    'If a customer doesn’t pay, you or your delivery company bear the loss. We do not pay shops for unpaid orders.',
    `We charge ${pct} commission on the product value of delivered orders, and you must pay it as we communicate.`,
    'Illegal, counterfeit or prohibited items mean suspension, and we may report them to the authorities.',
  ];
  return (
    <Card style={{ backgroundColor: C.surface }}>
      <Txt v="h3">Key points</Txt>
      {points.map((p) => <Txt key={p} v="small">• {p}</Txt>)}
      <Check checked={checked} onChange={onChange}>
        <Txt>I have read and agree to the <Txt color={C.crimson} bold onPress={() => router.push('/terms')}>Terms & Conditions</Txt>.</Txt>
      </Check>
    </Card>
  );
}
