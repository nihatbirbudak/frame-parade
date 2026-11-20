// Dikey (9:16) deneme sahnesi: 10 sn, sessiz. "Merhaba, <kanal adı>" kanca yazısı, künye, çizilen çizgi, sayaç ve
// standart ABONE OL kapanışı (imleç tıklaması). Ders içeriği yok; kurulumun çalıştığını gösterir.
//   node motor/render.mjs ornek-dikey
import { kunye, kanca, aboneDugmesi, aboneGoster } from '/motor/sayfa/ek.js';
export function kur({ tl, B, sahne, KANAL }) {
  const { R } = B;
  const A = B.katman(sahne, 'deneme'), s = B.svgK(A);
  kunye(A, tl, 10, (KANAL.seri || KANAL.ad).toLocaleUpperCase(KANAL.dil || 'tr'));
  kanca(A, tl, `Merhaba,\n${KANAL.ad}`, 3.2, { top: 420 });
  // çizgi + sayaç: motorun iki temel hareketi (çizim ve akan sayı)
  const cz = B.yol(s, 'M120,1000 L960,1000', 'c v'); B.ciz(tl, cz, 3.4, 0.8);
  const say = B.yazi(A, '0', { x: 540, y: 880, boy: 220, sayi: true, hiza: 'orta', dikey: 'orta' });
  B.ac(tl, say, 3.5, { tur: 'olcek', d: 0.4 }); B.sayac(tl, say, 3.6, 0, 100, 1.6);
  const et = B.yazi(A, 'ilk video hazır', { x: 540, y: 1080, boy: 56, ag: 700, renk: 'ik', hiza: 'orta' }); B.ac(tl, et, 4.4, { d: 0.5 });
  B.vurgula(tl, say, 5.2); B.sondur(tl, say, 6.0, 0.3, R.metin);
  // abone kapanışı: düğme 6,6 sn'de gelir, imleç 7,8 sn'de tıklar
  const a = aboneDugmesi(A, { y: 1300 }); aboneGoster(tl, a, 6.6, 7.8);
  tl.to(A, { autoAlpha: 0, duration: 0.5 }, 9.4);
}
