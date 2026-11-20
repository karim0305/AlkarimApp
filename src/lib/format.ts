const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const group = (n: number) => Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const rs = (n: number) => `Rs. ${n < 0 ? '-' : ''}${group(n)}`;
export const shortDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const finalPrice = (price: number, discount: number) => Math.round(price * (1 - discount / 100));
/** YYYY-MM-DD in the phone's own time zone */
export const localDay = (d: Date | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const todayStr = () => localDay(new Date());
export const daysBack = (n: number) => localDay(new Date(Date.now() - n * 86400000));
export const dayLabel = (d: string) => shortDate(`${d}T00:00:00`);
