const enc = new TextEncoder();
const dec = new TextDecoder();

export const b64urlEncode = (str) => {
  const bytes = enc.encode(str);
  const bin = bytes.reduce((s, b) => s + String.fromCharCode(b), '');
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const b64urlDecode = (b64) => {
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const base64 = b64.replace(/-/g,'+').replace(/_/g,'/') + pad;
  const bin = atob(base64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return dec.decode(bytes);
};