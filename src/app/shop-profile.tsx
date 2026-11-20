import React, { useEffect, useState } from 'react';
import { useMyShop } from '@/hooks/useMyShop';
import { useToast } from '@/context/toast';
import { updateShop } from '@/services/shops';
import { Badge, Button, Card, Field, Loading, Row, Screen, Txt } from '@/components/ui';
import { rs } from '@/lib/format';

export default function ShopProfile() {
  const { shop, shopId } = useMyShop(); const toast = useToast();
  const [f, setF] = useState({ name: '', city: '', phone: '', description: '' }); const [charge, setCharge] = useState(''); const [free, setFree] = useState('');
  const [b1, setB1] = useState(false); const [b2, setB2] = useState(false);
  useEffect(() => { if (shop) { setF({ name: shop.name, city: shop.city, phone: shop.phone ?? '', description: shop.description }); setCharge(String(shop.delivery_charge)); setFree(shop.free_delivery_above == null ? '' : String(shop.free_delivery_above)); } }, [shop?.id]); // eslint-disable-line
  if (!shop) return <Loading full />;
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const saveProfile = async () => {
    if (!f.name.trim()) { toast('Shop name is required.', 'error'); return; }
    setB1(true); try { await updateShop(shopId, { name: f.name.trim(), city: f.city, phone: f.phone, description: f.description }); toast('Shop profile saved.'); } catch (x) { toast((x as Error).message, 'error'); } setB1(false);
  };
  const saveDelivery = async () => {
    const c = Number(charge); const fr = free.trim() === '' ? null : Number(free);
    if (charge.trim() === '' || !(c >= 0)) { toast('Enter a delivery charge of Rs. 0 or more.', 'error'); return; }
    if (fr !== null && !(fr > 0)) { toast('Free-delivery amount must be above Rs. 0, or leave it empty.', 'error'); return; }
    setB2(true); try { await updateShop(shopId, { delivery_charge: Math.round(c), free_delivery_above: fr === null ? null : Math.round(fr) }); toast('Delivery settings saved.'); } catch (x) { toast((x as Error).message, 'error'); } setB2(false);
  };
  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}><Txt v="h3">Shop profile</Txt><Badge status={shop.status} /></Row>
        <Field label="Shop name" value={f.name} onChangeText={set('name')} autoCapitalize="words" />
        <Field label="City" value={f.city} onChangeText={set('city')} autoCapitalize="words" />
        <Field label="Contact number" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="About your shop" value={f.description} onChangeText={set('description')} multiline />
        <Button title="Save profile" loading={b1} onPress={saveProfile} />
      </Card>
      <Card>
        <Txt v="h3">Delivery charges</Txt>
        <Txt v="small">Added to every order from your shop. You collect it with the cash on delivery, and no commission is taken on it.</Txt>
        <Field label="Delivery charge (Rs.)" value={charge} onChangeText={(t) => setCharge(t.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Field label="Free delivery above (Rs.)" value={free} onChangeText={(t) => setFree(t.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="Empty = never free" />
        <Txt v="small">Customers pay {Number(charge) ? rs(Number(charge)) : 'no'} delivery{Number(free) > 0 ? `, free on orders of ${rs(Number(free))} or more.` : '. Delivery is never free.'}</Txt>
        <Button title="Save delivery settings" loading={b2} onPress={saveDelivery} />
      </Card>
    </Screen>
  );
}
