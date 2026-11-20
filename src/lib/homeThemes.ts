import type { AnnounceTheme, BannerTheme } from './types';

export const BANNER_THEMES: Record<BannerTheme, { label: string; bg: string; a: string; b: string; panel: string }> = {
  indigo: { label: 'Indigo', bg: '#1E2A5A', a: 'rgba(240,162,2,.14)', b: 'rgba(163,22,47,.35)', panel: '#161F44' },
  crimson: { label: 'Crimson', bg: '#7A1022', a: 'rgba(240,162,2,.16)', b: 'rgba(255,255,255,.07)', panel: '#5A0C1A' },
  forest: { label: 'Forest green', bg: '#1F4D3A', a: 'rgba(240,162,2,.14)', b: 'rgba(255,255,255,.07)', panel: '#153828' },
  plum: { label: 'Plum', bg: '#4A1D5C', a: 'rgba(240,162,2,.16)', b: 'rgba(255,255,255,.07)', panel: '#35143F' },
};
export const ANNOUNCE_THEMES: Record<AnnounceTheme, { label: string; bg: string; fg: string }> = {
  indigo: { label: 'Indigo', bg: '#161F44', fg: '#E3E6F5' },
  crimson: { label: 'Crimson (sale)', bg: '#A3162F', fg: '#FFFFFF' },
  gold: { label: 'Gold (offer)', bg: '#F0A202', fg: '#0F1630' },
  green: { label: 'Green (new)', bg: '#166534', fg: '#F0FDF4' },
};

/** Links must be an on-site path (/products) or a full http(s) address. Blocks javascript: and //host links. */
export const isValidLink = (l: string) => l === '' || /^(\/($|[^/])|https?:\/\/)/.test(l);
export const isLive = (x: { is_active: boolean; starts_at: string | null; ends_at: string | null }, now = Date.now()) =>
  x.is_active && (!x.starts_at || new Date(x.starts_at).getTime() <= now) && (!x.ends_at || new Date(x.ends_at).getTime() >= now);
