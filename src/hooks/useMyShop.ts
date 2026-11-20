import { useAuth } from '@/context/auth';
import { useQuery } from './useQuery';
import { getShop } from '@/services/shops';

export function useMyShop() {
  const { user } = useAuth();
  const q = useQuery(() => (user?.shop_id ? getShop(user.shop_id) : Promise.resolve(null)), [user?.shop_id]);
  return { shopId: user?.shop_id ?? '', shop: q.data, loading: q.loading, reload: q.reload };
}
