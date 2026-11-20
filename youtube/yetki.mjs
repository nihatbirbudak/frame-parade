// Run once: generates the address for the Google consent page, waits for the local redirect,
// writes the refresh token to `.env` › YOUTUBE_REFRESH_TOKEN. The token is not printed to the screen.
// Usage: node youtube/yetki.mjs [--yalniz-okuma]   (--yalniz-okuma: read-only scopes for analytics only, no upload; the address is also written to `youtube/yetki-adres.txt`)
import http from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { istemci, envYaz, KAPSAMLAR as TUM_KAPSAMLAR, OKUMA_KAPSAMLARI, KOK } from './api.mjs';
const KAPSAMLAR = process.argv.includes('--yalniz-okuma') ? OKUMA_KAPSAMLARI : TUM_KAPSAMLAR;
console.log(process.argv.includes('--yalniz-okuma') ? 'Read-only authorisation: youtube.readonly + yt-analytics.readonly (uploading will not work with this token).' : 'Full authorisation: upload, edit and analytics.');

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
    cevap.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Consent not granted: ' + (hata || 'state mismatch'));
    console.log('ERROR:', hata || 'state mismatch');
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
    if (!r.ok || !j.refresh_token) throw new Error(j.error_description || j.error || 'no refresh token was returned');
    envYaz('YOUTUBE_REFRESH_TOKEN', j.refresh_token);
    const verilen = (j.scope || '').split(' ').map(s => s.replace('https://www.googleapis.com/auth/', '')).join(', ');
    cevap.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end('Consent granted. You can close this tab.');
    console.log('DONE: the refresh token was written to the .env file. Granted scopes:', verilen);
    kapat(0);
  } catch (e) {
    cevap.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Could not get the token.');
    console.log('ERROR:', e.message);
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
  console.log('Consent address ready (yetki-adres.txt). Waiting for the redirect:', geriDonus);
});
setTimeout(() => { console.log('ERROR: no consent arrived within 15 minutes'); kapat(1); }, 15 * 60_000);
