// YouTube'a API ile yükleme.
// Varsayılan PROVA: hiçbir şey göndermez, yüklenecek her şeyi listeler ve denetler. Gerçek yükleme yalnız --yes ile.
//
// Kullanım (proje kökünden):
//   node youtube/yukle.mjs projeler/ornek-yatay --yayin "2026-12-01 19:00"          # prova
//   node youtube/yukle.mjs projeler/ornek-yatay --yayin "2026-12-01 19:00" --yes    # gerçek
//   node youtube/yukle.mjs projeler/ornek-dikey --hemen --ilgili <videoId> --yes
// Bayraklar:
//   --yayin "YYYY-MM-DD HH:MM"  İstanbul saatiyle planlı yayın (video o ana kadar gizli kalır)
//   --hemen                     hemen herkese açık
//   --gizli                     gizli yükle, planlama yok (deneme için)
//   --liste "<ad>"              oynatma listesi adı (uzun videolarda varsayılan kanal.json › youtube.oynatma_listesi; Shorts'ta yok)
//   --listesiz                  oynatma listesine ekleme
//   --ilgili <videoId>          Shorts için ilgili video: API'de alanı yok, yalnız rapora not düşer (Studio'dan eklenir)
//
// Proje düzeni (projeler/<ad>/; klasör adı ya da yolu verilebilir):
//   proje.json › bicim: "yatay" (uzun video) | "dikey" (Shorts)
//   cikti/tam.mp4 (render çıktısı) + paket/{baslik,aciklama,baslik-en,aciklama-en}.txt, altyazi(-en).srt, kapak-1280x720.jpg
// İsteğe bağlı: paket/etiketler.txt (satır başına bir etiket; yoksa kanal.json › youtube.etiketler).
// Yükleme kaydı: paket/youtube.json (videoId, adres, yayın zamanı, adımların sonucu).
// Gerçek yükleme için youtube/client_secret.json (Google Cloud OAuth istemcisi) ve .env › YOUTUBE_REFRESH_TOKEN gerekir
// (node youtube/yetki.mjs). Prova bunlar olmadan da çalışır, eksikleri bildirir.
import { readFileSync, writeFileSync, appendFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { api, erisimJetonu, KOK } from './api.mjs';
import { KANAL, PROJELER } from '../ayar.mjs';
import { ISTEMCI_YOLU, ENV_YOLU } from './api.mjs';

const argv = process.argv.slice(2);
const bayrak = (ad) => argv.includes(ad);
const deger = (ad) => { const i = argv.indexOf(ad); return i >= 0 ? argv[i + 1] : undefined; };
const klasorArg = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && ['--yayin', '--liste', '--ilgili'].includes(argv[i - 1])));
if (!klasorArg) { console.log('Klasör verilmedi. Örnek: node youtube/yukle.mjs projeler/ornek-yatay --yayin "2026-12-01 19:00"'); process.exit(2); }

const GERCEK = bayrak('--yes');
const klasor = existsSync(resolve(KOK, klasorArg)) ? resolve(KOK, klasorArg) : join(PROJELER, klasorArg);
if (!existsSync(klasor)) { console.log(`Proje bulunamadı: ${klasorArg} (${PROJELER.replace(KOK, '.')} altında ya da yol olarak verin)`); process.exit(2); }
const PJ = existsSync(join(klasor, 'proje.json')) ? JSON.parse(readFileSync(join(klasor, 'proje.json'), 'utf8')) : {};
const dersMi = PJ.bicim !== 'dikey';                         // uzun video (yatay) ↔ Shorts (dikey)
const paket = join(klasor, 'paket');

function oku(ad) { const y = join(paket, ad); return existsSync(y) ? readFileSync(y, 'utf8').replace(/^﻿/, '').trim() : null; }
function videoBul() { return join(klasor, 'cikti', 'tam.mp4'); }
function kapakBul() {
  for (const ad of ['kapak-1280x720.jpg', 'kapak.jpg', 'kapak.png']) if (existsSync(join(paket, ad))) return join(paket, ad);
  return null;
}
// yayın saati kanal.json › youtube.utc_farki ile yorumlanır (ör. "+03:00")
function istanbulISO(metin) {
  const m = metin && metin.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) throw new Error(`--yayin biçimi "YYYY-MM-DD HH:MM" olmalı, gelen: ${metin}`);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00${KANAL.youtube?.utc_farki || "+03:00"}`).toISOString();
}

// ---- Girdileri topla ve denetle ----
const sorunlar = [];
const video = videoBul();
if (!existsSync(video)) sorunlar.push(`video yok: ${video}`);
const baslik = oku('baslik.txt');
const aciklama = oku('aciklama.txt');
const baslikEn = oku('baslik-en.txt');
const aciklamaEn = oku('aciklama-en.txt');
const altyaziTr = existsSync(join(paket, 'altyazi.srt')) ? join(paket, 'altyazi.srt') : null;
const altyaziEn = existsSync(join(paket, 'altyazi-en.srt')) ? join(paket, 'altyazi-en.srt') : null;
// Shorts'a özel kapak API'den kurulamıyor (thumbnails.set 403, 20 Kas 2026 S5); kapak yalnız derslerde gönderilir
const kapak = dersMi ? kapakBul() : null;
const etiketler = (oku('etiketler.txt') || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
if (!etiketler.length) etiketler.push(...(KANAL.youtube?.etiketler || []));

if (!existsSync(paket)) sorunlar.push(`paket/ klasörü yok: ${paket.replace(KOK, '.')}`);
if (!baslik) sorunlar.push('paket/baslik.txt yok');
if (!aciklama) sorunlar.push('paket/aciklama.txt yok');
// kimlik bilgileri: prova için gerekmez; gerçek yüklemede eksikse dur
const kimlikEksik = [];
if (!existsSync(ISTEMCI_YOLU)) kimlikEksik.push('youtube/client_secret.json yok (Google Cloud Console > API ve Hizmetler > Kimlik bilgileri > OAuth istemcisi, "Masaüstü uygulaması"; JSON\'u bu adla youtube/ klasörüne koyun)');
if (!existsSync(ENV_YOLU) || !/^\s*YOUTUBE_REFRESH_TOKEN\s*=\s*\S+/m.test(readFileSync(ENV_YOLU, 'utf8'))) kimlikEksik.push('.env › YOUTUBE_REFRESH_TOKEN yok (client_secret.json koyduktan sonra: node youtube/yetki.mjs)');
if (GERCEK) sorunlar.push(...kimlikEksik);
if (baslik && [...baslik].length > 100) sorunlar.push(`başlık ${[...baslik].length} karakter (en çok 100)`);
if (baslikEn && [...baslikEn].length > 100) sorunlar.push(`EN başlık ${[...baslikEn].length} karakter (en çok 100)`);
for (const [ad, m] of [['açıklama', aciklama], ['EN açıklama', aciklamaEn]]) {
  if (!m) continue;
  if (Buffer.byteLength(m, 'utf8') > 5000) sorunlar.push(`${ad} 5000 baytı aşıyor`);
  if (/[<>]/.test(m)) sorunlar.push(`${ad} "<" ya da ">" içeriyor (YouTube kabul etmez)`);
}
for (const [ad, m] of [['başlık', baslik], ['EN başlık', baslikEn], ['açıklama', aciklama], ['EN açıklama', aciklamaEn]]) {
  const yt = m && m.match(/\{[^}\n]*\}/);
  if (yt) sorunlar.push(`${ad} doldurulmamış yer tutucu içeriyor: ${yt[0]}`);
}
// kanal.json › youtube.aciklama_zorunlu: açıklamada bulunması gereken ifadeler (ör. yapay ses bildirimi)
for (const z of KANAL.youtube?.aciklama_zorunlu || []) if (aciklama && !aciklama.includes(z)) sorunlar.push(`açıklamada zorunlu ifade yok: ${z}`);

const kipSayisi = [bayrak('--hemen'), bayrak('--gizli'), !!deger('--yayin')].filter(Boolean).length;
if (kipSayisi !== 1) sorunlar.push('tam olarak biri gerekli: --yayin "YYYY-MM-DD HH:MM" | --hemen | --gizli');
let publishAt = null;
try { if (deger('--yayin')) { publishAt = istanbulISO(deger('--yayin')); if (new Date(publishAt) <= new Date(Date.now() + 15 * 60_000)) sorunlar.push('yayın zamanı en az 15 dk ileride olmalı'); } }
catch (e) { sorunlar.push(e.message); }

const listeAdi = bayrak('--listesiz') ? null : (deger('--liste') || (dersMi ? KANAL.youtube?.oynatma_listesi || null : null));

const govde = {
  snippet: { title: baslik, description: aciklama, tags: etiketler, categoryId: KANAL.youtube?.kategori || '27', defaultLanguage: KANAL.dil || 'tr', defaultAudioLanguage: KANAL.dil || 'tr' },
  status: {
    privacyStatus: bayrak('--hemen') ? 'public' : 'private',
    ...(publishAt ? { publishAt } : {}),
    selfDeclaredMadeForKids: false,
    containsSyntheticMedia: !!KANAL.youtube?.yapay_zeka_beyani, // kanal.json › youtube.yapay_zeka_beyani
    embeddable: true,
    license: 'youtube',
  },
  ...(baslikEn || aciklamaEn ? { localizations: { en: { title: baslikEn || baslik, description: aciklamaEn || aciklama } } } : {}),
};

// ---- Rapor ----
const boyutMB = existsSync(video) ? (statSync(video).size / 1e6).toFixed(1) : '?';
console.log(`${GERCEK ? 'GERÇEK YÜKLEME' : 'PROVA (göndermez; gerçek için --yes)'} · ${dersMi ? 'uzun video' : 'Shorts'} · ${basename(klasor)}`);
console.log(`  video     : ${video.replace(KOK, '.')} (${boyutMB} MB)`);
console.log(`  başlık    : ${baslik}`);
console.log(`  EN başlık : ${baslikEn || '—'}`);
console.log(`  açıklama  : ${aciklama ? aciklama.length + ' karakter' : '—'} · EN ${aciklamaEn ? aciklamaEn.length + ' karakter' : '—'}`);
console.log(`  altyazı   : TR ${altyaziTr ? 'var' : '—'} · EN ${altyaziEn ? 'var' : '—'}`);
console.log(`  kapak     : ${kapak ? basename(kapak) : '—'}`);
console.log(`  görünürlük: ${govde.status.privacyStatus}${publishAt ? ' → herkese açık ' + new Date(publishAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : ''}`);
console.log(`  liste     : ${listeAdi || '—'} · kategori ${KANAL.youtube?.kategori || "27"} · çocuklara özel değil · yapay zekâ beyanı ${KANAL.youtube?.yapay_zeka_beyani ? "Evet" : "Hayır"}`);
console.log(`  etiketler : ${etiketler.join(', ')}`);
if (deger('--ilgili')) console.log(`  ilgili    : ${deger('--ilgili')} (API'de yok → Studio'dan eklenecek)`);
console.log(`  Studio'dan elle: son ekran${dersMi ? '' : ', Shorts ilgili video'}`);
if (sorunlar.length) { console.log('\nSORUNLAR:'); for (const s of sorunlar) console.log('  · ' + s); process.exit(1); }
if (!GERCEK) {
  if (kimlikEksik.length) { console.log('\nGerçek yükleme için eksik (prova için gerekmez):'); for (const s of kimlikEksik) console.log('  · ' + s); }
  console.log('\nProva temiz. Göndermek için aynı komutu --yes ile çalıştırın.'); process.exit(0);
}

// ---- Gerçek yükleme ----
const kayit = { klasor: klasorArg, baslangic: new Date().toISOString(), adimlar: {} };
const kayitYaz = () => writeFileSync(join(paket, 'youtube.json'), JSON.stringify(kayit, null, 2));

async function jetonluFetch(url, secenek) {
  const jeton = await erisimJetonu();
  return fetch(url, { ...secenek, headers: { ...(secenek.headers || {}), authorization: `Bearer ${jeton}` } });
}

// 1. Video (sürdürülebilir yükleme)
const bayt = readFileSync(video);
const parcalar = 'snippet,status' + (govde.localizations ? ',localizations' : '');
const bas = await jetonluFetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=${parcalar}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-length': String(bayt.length), 'x-upload-content-type': 'video/mp4' },
  body: JSON.stringify(govde),
});
if (!bas.ok) { console.log('HATA video başlatılamadı:', bas.status, (await bas.text()).slice(0, 400)); process.exit(1); }
const yer = bas.headers.get('location');
let videoKaynak = null;
for (let deneme = 1; deneme <= 3 && !videoKaynak; deneme++) {
  const r = await jetonluFetch(yer, { method: 'PUT', headers: { 'content-type': 'video/mp4' }, body: bayt });
  if (r.ok) videoKaynak = await r.json();
  else { console.log(`  video gönderimi ${deneme}. deneme: ${r.status}`); if (r.status < 500) { console.log((await r.text()).slice(0, 400)); process.exit(1); } }
}
if (!videoKaynak) { console.log('HATA: video gönderilemedi'); process.exit(1); }
const videoId = videoKaynak.id;
kayit.videoId = videoId;
kayit.adres = dersMi ? `https://youtu.be/${videoId}` : `https://youtube.com/shorts/${videoId}`;
kayit.durum = videoKaynak.status;
kayit.adimlar.video = 'tamam';
kayitYaz();
console.log(`\n✓ video yüklendi: ${kayit.adres} (${videoKaynak.status.privacyStatus}${videoKaynak.status.publishAt ? ', planlı ' + videoKaynak.status.publishAt : ''})`);

// 2. Kapak
if (kapak) {
  try {
    const r = await jetonluFetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`, {
      method: 'POST', headers: { 'content-type': kapak.endsWith('.png') ? 'image/png' : 'image/jpeg' }, body: readFileSync(kapak),
    });
    kayit.adimlar.kapak = r.ok ? 'tamam' : `hata ${r.status}: ${(await r.text()).slice(0, 200)}`;
  } catch (e) { kayit.adimlar.kapak = 'hata: ' + e.message; }
  console.log(`  kapak: ${kayit.adimlar.kapak}`);
}

// 3. Altyazılar
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
  return r.ok ? 'tamam' : `hata ${r.status}: ${(await r.text()).slice(0, 200)}`;
}
if (altyaziTr) { kayit.adimlar.altyaziTr = await altyaziYukle(altyaziTr, 'tr'); console.log(`  TR altyazı: ${kayit.adimlar.altyaziTr}`); }
if (altyaziEn) { kayit.adimlar.altyaziEn = await altyaziYukle(altyaziEn, 'en'); console.log(`  EN altyazı: ${kayit.adimlar.altyaziEn}`); }

// 4. Oynatma listesi
if (listeAdi) {
  try {
    const l = await api('https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50');
    const liste = (l.items || []).find(p => p.snippet.title === listeAdi);
    if (!liste) kayit.adimlar.liste = `liste bulunamadı: ${listeAdi}`;
    else {
      await api('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ snippet: { playlistId: liste.id, resourceId: { kind: 'youtube#video', videoId } } }),
      });
      kayit.adimlar.liste = `tamam (${listeAdi})`;
    }
  } catch (e) { kayit.adimlar.liste = 'hata: ' + e.message; }
  console.log(`  liste: ${kayit.adimlar.liste}`);
}

kayit.studioElle = dersMi ? ['son ekran'] : ['Shorts ilgili video' + (deger('--ilgili') ? ' → ' + deger('--ilgili') : ''), 'kapak (Studio > Küçük resim > Dosya yükle)'];
kayit.bitis = new Date().toISOString();
kayitYaz();
// Kural: API yüklemesinden hemen sonra; Studio işleri tek listede birikir,
// yüklemeyle aynı turda yapılır; yapılamayan (ör. ilgili video henüz planlı) satır "BEKLİYOR" kalır, her gün kontrol edilir.
{
  const liste = join(KOK, 'yonetim', 'studio-yapilacak.md');
  if (!existsSync(liste)) writeFileSync(liste, '# Studio\'dan elle yapılacaklar\n\nYükleme betiği satır ekler. Yükleme turunda yapılır; yapılınca satır "YAPILDI <tarih>" olur. Her gün 09:00 özetinde ve her yüklemede kontrol edilir.\n\n');
  const ad = basename(klasor);
  const tarih = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' });
  appendFileSync(liste, kayit.studioElle.map(i => `- [ ] ${tarih} · ${ad} (${videoId}) · ${i} · https://studio.youtube.com/video/${videoId}/edit\n`).join(''));
}
const hatali = Object.entries(kayit.adimlar).filter(([, v]) => !String(v).startsWith('tamam'));
console.log(`\n${hatali.length ? 'BİTTİ, ' + hatali.length + ' adım hatalı (youtube.json)' : 'BİTTİ, bütün adımlar tamam'}. Studio'dan elle: ${kayit.studioElle.join(', ')}.`);
console.log(`Studio: https://studio.youtube.com/video/${videoId}/edit`);
process.exit(hatali.length ? 1 : 0);
