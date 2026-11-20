// Vertical (9:16) test scene: 10 s, silent. Hook text "Hello, <channel name>", series label, a drawn line, a counter and
// the standard SUBSCRIBE closing (cursor click). No real content; it shows that the setup works.
// All on-screen text comes from kanal.json (ad, seri, ekran_metinleri) via M().
//   node motor/render.mjs ornek-dikey
import { kunye, kanca, aboneDugmesi, aboneGoster } from '/motor/sayfa/ek.js';
import { M, BUYUK } from '/motor/sayfa/kimlik.js';
export function kur({ tl, B, sahne, KANAL }) {
  const { R } = B;
  const A = B.katman(sahne, 'deneme'), s = B.svgK(A);
  kunye(A, tl, 10, BUYUK(KANAL.seri || KANAL.ad));
  kanca(A, tl, `${M('hello')}\n${KANAL.ad}`, 3.2, { top: 420 });
  // line + counter: the engine's two basic moves (drawing and a flowing number)
  const cz = B.yol(s, 'M120,1040 L960,1040', 'c v'); B.ciz(tl, cz, 3.4, 0.8);
  const say = B.yazi(A, '0', { x: 540, y: 880, boy: 220, sayi: true, hiza: 'orta', dikey: 'orta' });
  B.ac(tl, say, 3.5, { tur: 'olcek', d: 0.4 }); B.sayac(tl, say, 3.6, 0, 100, 1.6);
  const et = B.yazi(A, M('first_video_ready'), { x: 540, y: 1100, boy: 56, ag: 700, renk: 'ik', hiza: 'orta' }); B.ac(tl, et, 4.4, { d: 0.5 });
  B.vurgula(tl, say, 5.2); B.sondur(tl, say, 6.0, 0.3, R.metin);
  // subscribe closing: button appears at 6.6 s, the cursor clicks at 7.8 s
  const a = aboneDugmesi(A, { y: 1300 }); aboneGoster(tl, a, 6.6, 7.8);
  tl.to(A, { autoAlpha: 0, duration: 0.5 }, 9.4);
}
