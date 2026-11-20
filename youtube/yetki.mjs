// Bir kez çalıştırılır: Google izin sayfası için adres üretir, yerel geri dönüşü bekler,
// yenileme jetonunu `.env` › YOUTUBE_REFRESH_TOKEN'a yazar. Jeton ekrana yazılmaz.
// Kullanım: node youtube/yetki.mjs   (adres `youtube/yetki-adres.txt` dosyasına da yazılır)
import http from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { istemci, envYaz, KAPSAMLAR, KOK } from './api.mjs';

const { id, gizli, tokenUri } = istemci();
const dogrulayici = randomBytes(48).toString('base64url');
const meydan = createHash('sha256').update(dogrulayici).digest('base64url');
const durum = randomBytes(16).toString('hex');
const ADRES_DOSYASI = join(KOK, 'youtube', 'yetki-adres.txt');

const sunucu = http.createServer(async (istek, cevap) => {
  const u = new URL(istek.url, 'http://127.0.0.1');
  if (u.pathname !== '/') { cevap.writeHead(404).end(); return; }
  const kod = u.searchParams.get('code');
  const hata = u.searchParams.get('error');
  if (hata || u.searchParams.get('state') !== durum || !kod) {
    cevap.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('İzin alınamadı: ' + (hata || 'durum uyuşmadı'));
    console.log('HATA:', hata || 'durum uyuşmadı');
    kapat(1);
    return;
  }
  try {
    const r = await fetch(tokenUri, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: kod, client_id: id, client_secret: gizli, redirect_uri: geriDonus,
        grant_type: 'authorization_code', code_verifier: dogrulayici,
      }),
    });
    const j = await r.json();
    if (!r.ok || !j.refresh_token) throw new Error(j.error_description || j.error || 'yenileme jetonu gelmedi');
    envYaz('YOUTUBE_REFRESH_TOKEN', j.refresh_token);
    const verilen = (j.scope || '').split(' ').map(s => s.replace('https://www.googleapis.com/auth/', '')).join(', ');
    cevap.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end('izin alındı. Bu sekmeyi kapatabilirsiniz.');
    console.log('TAMAM: yenileme jetonu .env dosyasına yazıldı. Verilen kapsamlar:', verilen);
    kapat(0);
  } catch (e) {
    cevap.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Jeton alınamadı.');
    console.log('HATA:', e.message);
    kapat(1);
  }
});

let geriDonus = '';
function kapat(kod) {
  if (existsSync(ADRES_DOSYASI)) unlinkSync(ADRES_DOSYASI);
  setTimeout(() => { sunucu.close(); process.exit(kod); }, 300);
}

sunucu.listen(0, '127.0.0.1', () => {
  geriDonus = `http://127.0.0.1:${sunucu.address().port}/`;
  const q = new URLSearchParams({
    client_id: id, redirect_uri: geriDonus, response_type: 'code', scope: KAPSAMLAR.join(' '),
    access_type: 'offline', prompt: 'consent', state: durum,
    code_challenge: meydan, code_challenge_method: 'S256',
  });
  const adres = `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  writeFileSync(ADRES_DOSYASI, adres);
  console.log('İzin adresi hazır (yetki-adres.txt). Geri dönüş bekleniyor:', geriDonus);
});
setTimeout(() => { console.log('HATA: 15 dakika içinde izin gelmedi'); kapat(1); }, 15 * 60_000);
