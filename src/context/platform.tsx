import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_COMMISSION_RATE } from '@/lib/commission';
import { subscribe } from '@/lib/events';
import { getPlatformSettings } from '@/services/settings';

export const formatPct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;
const PlatformCtx = createContext({ rate: DEFAULT_COMMISSION_RATE, pct: formatPct(DEFAULT_COMMISSION_RATE) });
export const usePlatform = () => useContext(PlatformCtx);

/** The commission rate the admin set (Admin → Settings). */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState(DEFAULT_COMMISSION_RATE);
  useEffect(() => {
    const load = () => { getPlatformSettings().then((s) => setRate(s.commission_rate)).catch(() => { /* keep default */ }); };
    load();
    return subscribe(load);
  }, []);
  const value = useMemo(() => ({ rate, pct: formatPct(rate) }), [rate]);
  return <PlatformCtx.Provider value={value}>{children}</PlatformCtx.Provider>;
}
