import { Linking } from 'react-native';

/** Banner / announcement links are website paths. Map them to the app's screens (or open https links in the browser). */
export function openLink(router: { push: (href: string) => void }, link: string) {
  if (!link) return;
  if (/^https?:\/\//.test(link)) { void Linking.openURL(link); return; }
  let m = link.match(/^\/products\/([^/?]+)/);
  if (m) { router.push(`/product/${m[1]}`); return; }
  m = link.match(/^\/shops\/([^/?]+)/);
  if (m) { router.push(`/store/${m[1]}`); return; }
  if (link.startsWith('/shops')) { router.push('/stores'); return; }
  if (link.startsWith('/products')) { router.push(`/browse${link.slice('/products'.length)}`); return; }
  router.push(link);
}
export const callPhone = (phone: string) => void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
/** 0300 1234567 -> https://wa.me/923001234567 */
export const openWhatsApp = (phone: string) => { const d = phone.replace(/\D/g, ''); void Linking.openURL(`https://wa.me/${d.startsWith('0') ? `92${d.slice(1)}` : d}`); };
