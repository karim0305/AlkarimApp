import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSession, logout as doLogout } from '@/services/auth';
import type { Profile } from '@/lib/types';

interface AuthState { user: Profile | null; ready: boolean; refresh: () => Promise<void>; logout: () => Promise<void> }
const AuthCtx = createContext<AuthState>({ user: null, ready: false, refresh: async () => {}, logout: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    try { setUser(await getSession()); } catch { setUser(null); }
    setReady(true);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const logout = useCallback(async () => { setUser(null); try { await doLogout(); } catch { /* already signed out */ } }, []);
  const value = useMemo(() => ({ user, ready, refresh, logout }), [user, ready, refresh, logout]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
