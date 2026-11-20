import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from '@/lib/events';

/** Loads data, tracks loading / error / pull-to-refresh, and reloads quietly after any write anywhere in the app. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const run = useCallback((mode: 'first' | 'silent' | 'pull' = 'first') => {
    if (mode === 'first') setLoading(true);
    if (mode === 'pull') setRefreshing(true);
    setError(null);
    fnRef.current()
      .then((d) => { if (alive.current) setData(d); })
      .catch((e) => { if (alive.current) setError(e?.message ?? 'Something went wrong'); })
      .finally(() => { if (alive.current) { setLoading(false); setRefreshing(false); } });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run('first'); }, deps);
  useEffect(() => subscribe(() => run('silent')), [run]);
  return { data, loading, error, refreshing, reload: () => run('first'), refresh: () => run('pull') };
}
