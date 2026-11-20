import React from 'react';
import { useQuery } from '@/hooks/useQuery';
import { useConfirm, useToast } from '@/context/toast';
import { listAllReviews, setReviewHidden } from '@/services/reviews';
import { Badge, Button, Card, Empty, ErrorBox, Loading, Row, Screen, Stars, Txt } from '@/components/ui';
import { shortDate } from '@/lib/format';
import type { ReviewView } from '@/lib/types';

export default function AdminReviews() {
  const q = useQuery(listAllReviews); const confirm = useConfirm(); const toast = useToast();
  if (q.loading) return <Loading full />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const toggle = async (r: ReviewView) => {
    if (!r.is_hidden && !(await confirm({ title: 'Hide this review?', message: 'It disappears from the product page, the shop and the homepage. You can show it again later.', confirmLabel: 'Hide review', danger: true }))) return;
    try { await setReviewHidden(r.id, !r.is_hidden); toast(r.is_hidden ? 'Review is visible again.' : 'Review hidden.', 'info'); } catch (x) { toast((x as Error).message, 'error'); }
  };
  return (
    <Screen onRefresh={q.refresh} refreshing={q.refreshing}>
      <Txt v="small">Only customers whose order was delivered can review. Hide anything abusive or fake. Good reviews (4–5 stars with a comment) appear on the homepage.</Txt>
      {(q.data ?? []).length === 0 ? <Empty title="No reviews yet" /> : (q.data ?? []).map((r) => (
        <Card key={r.id} style={r.is_hidden ? { opacity: 0.6 } : undefined}>
          <Row style={{ justifyContent: 'space-between' }}><Row><Stars value={r.rating} /><Txt bold>{r.customer_name}</Txt></Row>{r.is_hidden ? <Badge status="inactive" /> : null}</Row>
          <Txt v="small">{r.product_name} · {r.product_code} · {r.shop_name} · {shortDate(r.created_at)}</Txt>
          {r.comment ? <Txt>{r.comment}</Txt> : <Txt v="small">No comment</Txt>}
          <Button title={r.is_hidden ? 'Show' : 'Hide'} small variant="outline" onPress={() => toggle(r)} />
        </Card>
      ))}
    </Screen>
  );
}
