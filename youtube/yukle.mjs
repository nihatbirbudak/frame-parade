// Upload to YouTube through the API.
// Default is a DRY RUN: it sends nothing, lists and checks everything that would be uploaded. A real upload only with --yes.
//
// Usage (from the project root):
//   node youtube/yukle.mjs projeler/ornek-yatay --yayin "2026-12-01 19:00"          # dry run
//   node youtube/yukle.mjs projeler/ornek-yatay --yayin "2026-12-01 19:00" --yes    # real
//   node youtube/yukle.mjs projeler/ornek-dikey --hemen --ilgili <videoId> --yes
// Flags:
//   --yayin "YYYY-MM-DD HH:MM"  scheduled publication in Istanbul time (the video stays private until then)
//   --hemen                     public immediately
//   --gizli                     upload as private, no scheduling (for testing)
//   --liste "<name>"            playlist name (for long videos the default is kanal.json › youtube.oynatma_listesi; none for Shorts)
//   --listesiz                  do not add to a playlist
//   --yeniden                   upload again even though paket/youtube.json already records a videoId (default: refuse)
//   --ilgili <videoId>          related video for Shorts: there is no field in the API, it only leaves a note in the report (added from Studio)
//
// Project layout (projeler/<name>/; a folder name or a path can be given):
//   proje.json › bicim: "yatay" (long video) | "dikey" (Shorts)
//   cikti/tam.mp4 (render output) + paket/{baslik,aciklama,baslik-en,aciklama-en}.txt, altyazi(-en).srt, kapak-1280x720.jpg
// Optional: paket/etiketler.txt (one tag per line; otherwise kanal.json › youtube.etiketler).
// Upload record: paket/youtube.json (videoId, address, publish time, result of each step).
// A real upload needs youtube/client_secret.json (Google Cloud OAuth client) and .env › YOUTUBE_REFRESH_TOKEN
// (node youtube/yetki.mjs). The dry run works without them and reports what is missing.
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { api, erisimJetonu, KOK } from './api.mjs';
import { KANAL, PROJELER } from '../ayar.mjs';
import { ISTEMCI_YOLU, ENV_YOLU } from './api.mjs';

const argv = process.argv.slice(2);
const bayrak = (ad) => argv.includes(ad);
const deger = (ad) => { const i = argv.indexOf(ad); return i >= 0 ? argv[i + 1] : undefined; };
const klasorArg = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && ['--yayin', '--liste', '--ilgili'].includes(argv[i - 1])));
if (!klasorArg) { console.log('No folder given. Example: node youtube/yukle.mjs projeler/ornek-yatay --yayin "2026-12-01 19:00"'); process.exit(2); }

const GERCEK = bayrak('--yes');
const klasor = existsSync(resolve(KOK, klasorArg)) ? resolve(KOK, klasorArg) : join(PROJELER, klasorArg);
if (!existsSync(klasor)) { console.log(`Project not found: ${klasorArg} (give it under ${PROJELER.replace(KOK, '.')} or as a path)`); process.exit(2); }
const PJ = existsSync(join(klasor, 'proje.json')) ? JSON.parse(readFileSync(join(klasor, 'proje.json'), 'utf8')) : {};
const dersMi = PJ.bicim !== 'dikey';                         // long video (landscape) ↔ Shorts (portrait)
const paket = join(klasor, 'paket');

function oku(ad) { const y = join(paket, ad); return existsSync(y) ? readFileSync(y, 'utf8').replace(/^﻿/, '').trim() : null; }
function videoBul() { return join(klasor, 'cikti', 'tam.mp4'); }
function kapakBul() {
  for (const ad of ['kapak-1280x720.jpg', 'kapak.jpg', 'kapak.png']) if (existsSync(join(paket, ad))) return join(paket, ad);
  return null;
}
// the publish time is interpreted with kanal.json › youtube.utc_farki (e.g. "+03:00")
function istanbulISO(metin) {
  const m = metin && metin.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) throw new Error(`--yayin format must be "YYYY-MM-DD HH:MM", got: ${metin}`);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00${KANAL.youtube?.utc_farki || "+03:00"}`).toISOString();
}

// ---- Collect and check the inputs ----
const sorunlar = [];
const video = videoBul();
if (!existsSync(video)) sorunlar.push(`video missing: ${video}`);
const baslik = oku('baslik.txt');
const aciklama = oku('aciklama.txt');
const baslikEn = oku('baslik-en.txt');
const aciklamaEn = oku('aciklama-en.txt');
const altyaziTr = existsSync(join(paket, 'altyazi.srt')) ? join(paket, 'altyazi.srt') : null;
const altyaziEn = existsSync(join(paket, 'altyazi-en.srt')) ? join(paket, 'altyazi-en.srt') : null;
// A custom cover for Shorts cannot be set through the API (thumbnails.set 403, 20 Nov 2026 S5); the cover is only sent for lessons
const kapak = dersMi ? kapakBul() : null;
const etiketler = (oku('etiketler.txt') || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
if (!etiketler.length) etiketler.push(...(KANAL.youtube?.etiketler || []));

if (!existsSync(paket)) sorunlar.push(`paket/ folder missing: ${paket.replace(KOK, '.')}`);
if (!baslik) sorunlar.push('paket/baslik.txt missing');
if (!aciklama) sorunlar.push('paket/aciklama.txt missing');
// credentials: not needed for a dry run; stop if they are missing in a real upload
const kimlikEksik = [];
if (!existsSync(ISTEMCI_YOLU)) kimlikEksik.push('youtube/client_secret.json missing (Google Cloud Console > APIs & Services > Credentials > OAuth client, "Desktop app"; put the JSON in the youtube/ folder under this name)');
if (!existsSync(ENV_YOLU) || !/^\s*YOUTUBE_REFRESH_TOKEN\s*=\s*\S+/m.test(readFileSync(ENV_YOLU, 'utf8'))) kimlikEksik.push('.env › YOUTUBE_REFRESH_TOKEN missing (after adding client_secret.json: node youtube/yetki.mjs)');
if (GERCEK) sorunlar.push(...kimlikEksik);
// required: made-for-kids declaration (kanal.json › youtube.cocuklara_ozel must be true or false; empty stops the upload)
const COCUK = KANAL.youtube?.cocuklara_ozel;
if (typeof COCUK !== 'boolean') sorunlar.push('kanal.json › youtube.cocuklara_ozel is empty: set true (made for kids) or false');
// double-upload guard: an earlier upload of this folder is recorded in paket/youtube.json
const ONCEKI = join(paket, 'youtube.json');
if (existsSync(ONCEKI)) { try { const o = JSON.parse(readFileSync(ONCEKI, 'utf8')); if (o.videoId && !bayrak('--yeniden')) sorunlar.push(`already uploaded (paket/youtube.json › videoId ${o.videoId}); add --yeniden to upload again`); } catch { sorunlar.push('paket/youtube.json is unreadable; fix or move it before uploading'); } }
if (baslik && [...baslik].length > 100) sorunlar.push(`title is ${[...baslik].length} characters (max 100)`);
if (baslikEn && [...baslikEn].length > 100) sorunlar.push(`EN title is ${[...baslikEn].length} characters (max 100)`);
for (const [ad, m] of [['description', aciklama], ['EN description', aciklamaEn]]) {
  if (!m) continue;
  if (Buffer.byteLength(m, 'utf8') > 5000) sorunlar.push(`${ad} exceeds 5000 bytes`);
  if (/[<>]/.test(m)) sorunlar.push(`${ad} contains "<" or ">" (YouTube does not accept it)`);
}
for (const [ad, m] of [['title', baslik], ['EN title', baslikEn], ['description', aciklama], ['EN description', aciklamaEn]]) {
  const yt = m && m.match(/\{[^}\n]*\}/);
  if (yt) sorunlar.push(`${ad} contains an unfilled placeholder: ${yt[0]}`);
}
// kanal.json › youtube.aciklama_zorunlu: phrases that must appear in the description (e.g. a synthetic-voice disclosure)
for (const z of KANAL.youtube?.aciklama_zorunlu || []) if (aciklama && !aciklama.includes(z)) sorunlar.push(`required phrase missing in the description: ${z}`);

const kipSayisi = [bayrak('--hemen'), bayrak('--gizli'), !!deger('--yayin')].filter(Boolean).length;
if (kipSayisi !== 1) sorunlar.push('exactly one is required: --yayin "YYYY-MM-DD HH:MM" | --hemen | --gizli');
let publishAt = null;
try { if (deger('--yayin')) { publishAt = istanbulISO(deger('--yayin')); if (new Date(publishAt) <= new Date(Date.now() + 15 * 60_000)) sorunlar.push('the publish time must be at least 15 minutes ahead'); } }
catch (e) { sorunlar.push(e.message); }

const listeAdi = bayrak('--listesiz') ? null : (deger('--liste') || (dersMi ? KANAL.youtube?.oynatma_listesi || null : null));

const govde = {
  snippet: { title: baslik, description: aciklama, tags: etiketler, categoryId: KANAL.youtube?.kategori || '27', defaultLanguage: KANAL.dil || 'tr', defaultAudioLanguage: KANAL.dil || 'tr' },
  status: {
    privacyStatus: bayrak('--hemen') ? 'public' : 'private',
    ...(publishAt ? { publishAt } : {}),
    selfDeclaredMadeForKids: COCUK === true,   // kanal.json › youtube.cocuklara_ozel (required)
    containsSyntheticMedia: !!KANAL.youtube?.yapay_zeka_beyani, // kanal.json › youtube.yapay_zeka_beyani (AI disclosure)
    embeddable: true,
    license: 'youtube',
  },
  ...(baslikEn || aciklamaEn ? { localizations: { en: { title: baslikEn || baslik, description: aciklamaEn || aciklama } } } : {}),
};

// ---- Report ----
const boyutMB = existsSync(video) ? (statSync(video).size / 1e6).toFixed(1) : '?';
console.log(`${GERCEK ? 'REAL UPLOAD' : 'DRY RUN (sends nothing; use --yes for a real one)'} · ${dersMi ? 'long video' : 'Shorts'} · ${basename(klasor)}`);
console.log(`  video      : ${video.replace(KOK, '.')} (${boyutMB} MB)`);
console.log(`  title      : ${baslik}`);
console.log(`  EN title   : ${baslikEn || '—'}`);
console.log(`  description: ${aciklama ? aciklama.length + ' characters' : '—'} · EN ${aciklamaEn ? aciklamaEn.length + ' characters' : '—'}`);
console.log(`  subtitles  : TR ${altyaziTr ? 'yes' : '—'} · EN ${altyaziEn ? 'yes' : '—'}`);
console.log(`  cover      : ${kapak ? basename(kapak) : '—'}`);
console.log(`  visibility : ${govde.status.privacyStatus}${publishAt ? ' → public ' + new Date(publishAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : ''}`);
console.log(`  playlist   : ${listeAdi || '—'} · category ${KANAL.youtube?.kategori || "27"} · made for kids: ${COCUK === true ? "yes" : COCUK === false ? "no" : "NOT SET"} · AI disclosure ${KANAL.youtube?.yapay_zeka_beyani ? "Yes" : "No"}`);
console.log(`  tags       : ${etiketler.join(', ')}`);
if (deger('--ilgili')) console.log(`  related    : ${deger('--ilgili')} (not in the API → to be added from Studio)`);
console.log(`  Manual in Studio: end screen${dersMi ? '' : ', Shorts related video'}`);
if (sorunlar.length) { console.log('\nPROBLEMS:'); for (const s of sorunlar) console.log('  · ' + s); process.exit(1); }
if (!GERCEK) {
  if (kimlikEksik.length) { console.log('\nMissing for a real upload (not needed for a dry run):'); for (const s of kimlikEksik) console.log('  · ' + s); }
  console.log('\nDry run is clean. To send, run the same command with --yes.'); process.exit(0);
}

// ---- Real upload ----
// target channel check: the authorised account must own the channel named in kanal.json › youtube.kanal_kimligi
const BEKLENEN = KANAL.youtube?.kanal_kimligi;
if (!BEKLENEN) { console.log('\nSTOPPED: kanal.json › youtube.kanal_kimligi is empty. Put your channel ID (UC…) there so uploads cannot go to another account.'); process.exit(1); }
{
  const kn = await api('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true');
  const k = (kn.items || [])[0];
  if (!k || k.id !== BEKLENEN) { console.log(`\nSTOPPED: the authorised account's channel is ${k ? `"${k.snippet.title}" (${k.id})` : 'missing'}, expected ${BEKLENEN}. Re-run node youtube/yetki.mjs with the right Google account.`); process.exit(1); }
  console.log(`  channel   : "${k.snippet.title}" (${k.id}) matches kanal.json`);
}
const kayit = { klasor: klasorArg, baslangic: new Date().toISOString(), adimlar: {} };
const kayitYaz = () => writeFileSync(join(paket, 'youtube.json'), JSON.stringify(kayit, null, 2));

async function jetonluFetch(url, secenek) {
  const jeton = await erisimJetonu();
  return fetch(url, { ...secenek, headers: { ...(secenek.headers || {}), authorization: `Bearer ${jeton}` } });
}

// 1. Video (resumable upload)
const bayt = readFileSync(video);
const parcalar = 'snippet,status' + (govde.localizations ? ',localizations' : '');
const bas = await jetonluFetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=${parcalar}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-length': String(bayt.length), 'x-upload-content-type': 'video/mp4' },
  body: JSON.stringify(govde),
});
if (!bas.ok) { console.log('ERROR could not start the video upload:', bas.status, (await bas.text()).slice(0, 400)); process.exit(1); }
const yer = bas.headers.get('location');
let videoKaynak = null;
for (let deneme = 1; deneme <= 3 && !videoKaynak; deneme++) {
  const r = await jetonluFetch(yer, { method: 'PUT', headers: { 'content-type': 'video/mp4' }, body: bayt });
  if (r.ok) videoKaynak = await r.json();
  else { console.log(`  video upload attempt ${deneme}: ${r.status}`); if (r.status < 500) { console.log((await r.text()).slice(0, 400)); process.exit(1); } }
}
if (!videoKaynak) { console.log('ERROR: the video could not be sent'); process.exit(1); }
const videoId = videoKaynak.id;
kayit.videoId = videoId;
kayit.adres = dersMi ? `https://youtu.be/${videoId}` : `https://youtube.com/shorts/${videoId}`;
kayit.durum = videoKaynak.status;
kayit.adimlar.video = 'done';
kayitYaz();
console.log(`\n✓ video uploaded: ${kayit.adres} (${videoKaynak.status.privacyStatus}${videoKaynak.status.publishAt ? ', scheduled ' + videoKaynak.status.publishAt : ''})`);

// 2. Cover
if (kapak) {
  try {
    const r = await jetonluFetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`, {
      method: 'POST', headers: { 'content-type': kapak.endsWith('.png') ? 'image/png' : 'image/jpeg' }, body: readFileSync(kapak),
    });
    kayit.adimlar.kapak = r.ok ? 'done' : `error ${r.status}: ${(await r.text()).slice(0, 200)}`;
  } catch (e) { kayit.adimlar.kapak = 'error: ' + e.message; }
  console.log(`  cover: ${kayit.adimlar.kapak}`);
}

// 3. Subtitles
async function altyaziYukle(yol, dil) {
  const sinir = 'kit' + Date.now();
  const ust = JSON.stringify({ snippet: { videoId, language: dil, name: '', isDraft: false } });
  const govdeBuf = Buffer.concat([
    Buffer.from(`--${sinir}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${ust}\r\n--${sinir}\r\nContent-Type: application/octet-stream\r\n\r\n`),
    readFileSync(yol),
    Buffer.from(`\r\n--${sinir}--`),
  ]);
  const r = await jetonluFetch('https://www.googleapis.com/upload/youtube/v3/captions?part=snippet&uploadType=multipart', {
    method: 'POST', headers: { 'content-type': `multipart/related; boundary=${sinir}` }, body: govdeBuf,
  });
  return r.ok ? 'done' : `error ${r.status}: ${(await r.text()).slice(0, 200)}`;
}
if (altyaziTr) { kayit.adimlar.altyaziTr = await altyaziYukle(altyaziTr, 'tr'); console.log(`  TR subtitles: ${kayit.adimlar.altyaziTr}`); }
if (altyaziEn) { kayit.adimlar.altyaziEn = await altyaziYukle(altyaziEn, 'en'); console.log(`  EN subtitles: ${kayit.adimlar.altyaziEn}`); }

// 4. Playlist
if (listeAdi) {
  try {
    const l = await api('https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50');
    const liste = (l.items || []).find(p => p.snippet.title === listeAdi);
    if (!liste) kayit.adimlar.liste = `playlist not found: ${listeAdi}`;
    else {
      await api('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ snippet: { playlistId: liste.id, resourceId: { kind: 'youtube#video', videoId } } }),
      });
      kayit.adimlar.liste = `done (${listeAdi})`;
    }
  } catch (e) { kayit.adimlar.liste = 'error: ' + e.message; }
  console.log(`  playlist: ${kayit.adimlar.liste}`);
}

kayit.studioElle = dersMi ? ['end screen'] : ['Shorts related video' + (deger('--ilgili') ? ' → ' + deger('--ilgili') : ''), 'cover (Studio > Thumbnail > Upload file)'];
kayit.bitis = new Date().toISOString();
kayitYaz();
// Rule: right after the API upload; Studio tasks accumulate in a single list,
// are done in the same round as the upload; a task that cannot be done (e.g. the related video is still scheduled) stays as "WAITING" and is checked every day.
{
  const liste = join(KOK, 'yonetim', 'studio-yapilacak.md');
  if (!existsSync(liste)) writeFileSync(liste, '# Manual to-dos in Studio\n\nThe upload script adds lines. They are done during the upload round; when done, the line becomes "DONE <date>". Checked in the 09:00 daily summary and on every upload.\n\n');
  const ad = basename(klasor);
  const tarih = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' });
  appendFileSync(liste, kayit.studioElle.map(i => `- [ ] ${tarih} · ${ad} (${videoId}) · ${i} · https://studio.youtube.com/video/${videoId}/edit\n`).join(''));
}
const hatali = Object.entries(kayit.adimlar).filter(([, v]) => !String(v).startsWith('done'));
console.log(`\n${hatali.length ? 'FINISHED, ' + hatali.length + ' step(s) failed (youtube.json)' : 'FINISHED, all steps done'}. Manual in Studio: ${kayit.studioElle.join(', ')}.`);
console.log(`Studio: https://studio.youtube.com/video/${videoId}/edit`);
process.exit(hatali.length ? 1 : 0);
