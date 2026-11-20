import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth';
import { useToast } from './toast';
import { blockedMessage } from '@/lib/roles';
import type { CartLine } from '@/lib/types';

const KEY = 'cart_v1';
interface CartState { lines: CartLine[]; count: number; add: (l: CartLine) => boolean; setQty: (k: CartLine, q: number) => void; remove: (l: CartLine) => void; clear: () => void }
const CartCtx = createContext<CartState>({ lines: [], count: 0, add: () => false, setQty: () => {}, remove: () => {}, clear: () => {} });
export const useCart = () => useContext(CartCtx);
const same = (a: CartLine, b: CartLine) => a.product_id === b.product_id && a.size === b.size && a.color === b.color;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); const toast = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => { try { setLines((JSON.parse(raw ?? '[]') as CartLine[]).filter((l) => UUID.test(l.product_id))); } catch { /* empty cart */ } });
  }, []);
  const save = useCallback((l: CartLine[]) => { setLines(l); void AsyncStorage.setItem(KEY, JSON.stringify(l)); }, []);
  const value = useMemo<CartState>(() => ({
    lines, count: lines.reduce((s, l) => s + l.quantity, 0),
    add: (l) => {
      // only customer accounts can order
      if (user && user.role !== 'customer') { toast(blockedMessage(user.role), 'error'); return false; }
      save(lines.some((x) => same(x, l)) ? lines.map((x) => (same(x, l) ? { ...x, quantity: x.quantity + l.quantity } : x)) : [...lines, l]);
      return true;
    },
    setQty: (k, q) => save(lines.map((x) => (same(x, k) ? { ...x, quantity: Math.max(1, q) } : x))),
    remove: (k) => save(lines.filter((x) => !same(x, k))),
    clear: () => save([]),
  }), [lines, user, toast, save]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
