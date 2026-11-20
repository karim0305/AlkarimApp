import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@/hooks/useQuery';
import { useMyShop } from '@/hooks/useMyShop';
import { listShopReviews } from '@/services/reviews';
import { averageRating } from '@/components/shared';
import { Card, Empty, ErrorBox, Loading, Row, Screen, Stars, Txt } from '@/components/ui';
import { shortDate } from '@/lib/format';

export default function ShopReviews() {
  const { shopId } = useMyShop();
  const q = useQuery(() => listShopReviews(shopId), [shopId]);
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const list = q.data ?? []; const avg = averageRating(list);
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      <Card><Row style={{ gap: 14 }}><Txt style={{ fontSize: 34, fontWeight: '800' }}>{list.length ? avg.toFixed(1) : '–'}</Txt><View><Stars value={avg} size={20} /><Txt v="small">{list.length} review{list.length === 1 ? '' : 's'} from customers whose orders were delivered</Txt></View></Row></Card>
      {list.length === 0 ? <Empty title="No reviews yet" text="Customers can review your products after their order is delivered." /> : list.map((r) => (
        <Card key={r.id}><Row style={{ justifyContent: 'space-between' }}><Row><Stars value={r.rating} /><Txt bold>{r.customer_name}</Txt></Row><Txt v="tiny">{shortDate(r.created_at)}</Txt></Row><Txt v="small">{r.product_name} · {r.product_code}</Txt>{r.comment ? <Txt>{r.comment}</Txt> : null}</Card>
      ))}
    </Screen>
  );
}
