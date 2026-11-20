export const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0;
  return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});
export const mimeOf = (uri: string) => {
  const e = uri.split('?')[0].split('.').pop()?.toLowerCase();
  return e === 'png' ? 'image/png' : e === 'webp' ? 'image/webp' : e === 'heic' ? 'image/heic' : 'image/jpeg';
};
export const extOf = (mime: string) => (mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1]);
