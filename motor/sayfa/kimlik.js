// Tarayıcı tarafı kimlik: kanal.json'u okur, renkleri ve yazı tiplerini CSS değişkenlerine yazar. Bileşenler KANAL'ı buradan alır.
// Bu modül en önce yüklenir (bilesen.js de buradan içe aktarır), böylece renkler bileşenler kurulmadan hazırdır.
export const KANAL = await fetch('/kanal.json').then((r) => r.json());
const k = KANAL.renkler || {}, y = KANAL.yazitipleri || {}, kok = document.documentElement.style;
for (const [ad, deger] of Object.entries({ zemin: k.zemin, yuzey: k.yuzey, cizgi: k.cizgi, ikincil: k.ik, metin: k.metin, vurgu: k.vu })) if (deger) kok.setProperty(`--${ad}`, deger);
if (y.baslik) kok.setProperty('--baslik', `'${y.baslik}', system-ui, sans-serif`);
if (y.sayi) kok.setProperty('--sayi', `'${y.sayi}', ui-monospace, monospace`);
export const M = (anahtar, varsayilan) => KANAL.metinler?.[anahtar] ?? varsayilan;
