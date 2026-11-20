// YouTube API ortak yardımcıları (bağımlılıksız).
// Gizli bilgiler: istemci `client_secret.json`, yenileme jetonu `.env` › YOUTUBE_REFRESH_TOKEN.
// Hiçbir fonksiyon jeton ya da gizli anahtarı ekrana yazmaz.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BURASI = dirname(fileURLToPath(import.meta.url));
export const KOK = join(BURASI, '..');
export const ENV_YOLU = join(KOK, '.env');
export const ISTEMCI_YOLU = join(BURASI, 'client_secret.json');

export const KAPSAMLAR = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

export function istemci() {
  const j = JSON.parse(readFileSync(ISTEMCI_YOLU, 'utf8'));
  const k = j.installed || j.web;
  return { id: k.client_id, gizli: k.client_secret, tokenUri: k.token_uri || 'https://oauth2.googleapis.com/token' };
}

export function envOku() {
  const sonuc = {};
  if (!existsSync(ENV_YOLU)) return sonuc;
  for (const satir of readFileSync(ENV_YOLU, 'utf8').split(/\r?\n/)) {
    const m = satir.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) sonuc[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return sonuc;
}

export function envYaz(anahtar, deger) {
  let metin = existsSync(ENV_YOLU) ? readFileSync(ENV_YOLU, 'utf8') : '';
  const re = new RegExp(`^${anahtar}=.*$`, 'm');
  if (re.test(metin)) metin = metin.replace(re, `${anahtar}=${deger}`);
  else metin = metin.replace(/\s*$/, '') + `\n${anahtar}=${deger}\n`;
  writeFileSync(ENV_YOLU, metin);
}

let onbellek = null;
export async function erisimJetonu() {
  if (onbellek && onbellek.bitis > Date.now() + 60_000) return onbellek.jeton;
  const yenileme = envOku().YOUTUBE_REFRESH_TOKEN;
  if (!yenileme) throw new Error('YOUTUBE_REFRESH_TOKEN yok: önce `node youtube/yetki.mjs` çalıştırılmalı.');
  const { id, gizli, tokenUri } = istemci();
  const r = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: gizli, refresh_token: yenileme, grant_type: 'refresh_token' }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`jeton yenilenemedi: ${j.error || r.status} ${j.error_description || ''}`);
  onbellek = { jeton: j.access_token, bitis: Date.now() + (j.expires_in || 3600) * 1000 };
  return onbellek.jeton;
}

export async function api(url, secenek = {}) {
  const jeton = await erisimJetonu();
  const r = await fetch(url, { ...secenek, headers: { ...(secenek.headers || {}), authorization: `Bearer ${jeton}` } });
  const tur = r.headers.get('content-type') || '';
  const govde = tur.includes('json') ? await r.json() : await r.text();
  if (!r.ok) {
    const e = new Error(`API ${r.status}: ${typeof govde === 'string' ? govde.slice(0, 300) : JSON.stringify(govde.error || govde).slice(0, 300)}`);
    e.durum = r.status;
    throw e;
  }
  return govde;
}
