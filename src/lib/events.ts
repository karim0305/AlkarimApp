/** After a write, every screen showing that data reloads (same idea as the web app). */
const listeners = new Set<() => void>();
export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const notify = () => listeners.forEach((l) => l());
