// Browser-side identity: reads kanal.json, writes colours and fonts into CSS variables. Components take KANAL and M() from here.
// This module loads first (bilesen.js imports it too), so colours are ready before any component is built.
export const KANAL = await fetch('/kanal.json').then((r) => r.json());
const k = KANAL.renkler || {}, y = KANAL.yazitipleri || {}, kok = document.documentElement.style;
for (const [ad, deger] of Object.entries({ zemin: k.zemin, yuzey: k.yuzey, cizgi: k.cizgi, ikincil: k.ik, metin: k.metin, vurgu: k.vu })) if (deger) kok.setProperty(`--${ad}`, deger);
if (y.baslik) kok.setProperty('--baslik', `'${y.baslik}', system-ui, sans-serif`);
if (y.sayi) kok.setProperty('--sayi', `'${y.sayi}', ui-monospace, monospace`);
export const DIL = KANAL.dil || 'en';

// On-screen text. Order: kanal.json › ekran_metinleri[key] → built-in text for kanal.dil → English.
const SOZLUK = {
  en: { next: 'Next', chapter: 'CHAPTER', closing: 'WRAP-UP', episode: 'Episode', like: 'LIKE', subscribe: 'SUBSCRIBE', subscribed: 'SUBSCRIBED',
    full_video: 'FULL VIDEO', hello: 'Hello,', first_video_ready: 'first video ready', setup_test: 'Setup test', first_chapter: 'First chapter',
    chain: ['idea', 'script', 'voice', 'video'] },
  tr: { next: 'Sonraki', chapter: 'BÖLÜM', closing: 'KAPANIŞ', episode: 'Ders', like: 'BEĞEN', subscribe: 'ABONE OL', subscribed: 'ABONE OLUNDU',
    full_video: 'TAM VİDEO', hello: 'Merhaba,', first_video_ready: 'ilk video hazır', setup_test: 'Kurulum denemesi', first_chapter: 'İlk bölüm',
    chain: ['fikir', 'metin', 'ses', 'video'] },
};
export const M = (anahtar) => KANAL.ekran_metinleri?.[anahtar] ?? SOZLUK[DIL]?.[anahtar] ?? SOZLUK.en[anahtar] ?? anahtar;
export const BUYUK = (s) => s.toLocaleUpperCase(DIL);
