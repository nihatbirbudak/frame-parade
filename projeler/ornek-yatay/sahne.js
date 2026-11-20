// Horizontal (16:9) test scene: 14 s, silent. Opening transition + title card ("Hello, <channel name>"), chapter card,
// box-and-arrow chain and the support card (like · subscribe · bell). No real content; it shows how components are called.
// All on-screen text comes from kanal.json (ad, seri, ekran_metinleri) via M().
//   node motor/render.mjs ornek-yatay
import { destekKarti, destekGoster } from '/motor/sayfa/destek.js';
import { M } from '/motor/sayfa/kimlik.js';
export function kur({ tl, B, sahne, KANAL }) {
  const g = B.katman(sahne, 'acilis');
  const gecis = B.acilisGecis(tl, g, 0.2, 1.0);
  const kun = B.dersKunyesi(g, { no: 1, ad: `${M('hello')} ${KANAL.ad}`, soru: M('setup_test') });
  B.dersKunyesiGoster(tl, kun, 0.6, { soruT: 1.4, son: 3.0, gecis });
  const kart = B.bolumKarti(sahne, { no: 1, baslik: M('first_chapter'), ders: 1 }); B.kartGoster(tl, kart, 3.3, 5.0);
  const A = B.katman(sahne, 'zincir');
  const z = B.zincir(A, M('chain'), { x: 300, y: 480 }); B.zincirAc(tl, z, 5.2);
  tl.to(A, { autoAlpha: 0, y: -24, duration: 0.4 }, 7.4);
  const d = destekKarti(sahne, { ders: 1 });
  destekGoster(tl, d, 7.6, { tiklar: [['abone', 9.1], ['begen', 10.2], ['zil', 11.2]], t1: 13.6 });
}
