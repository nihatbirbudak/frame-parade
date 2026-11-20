// Yatay (16:9) deneme sahnesi: 14 sn, sessiz. Açılış geçişi + künye ("Merhaba, <kanal adı>"), bölüm kartı, kutu-ok zinciri
// ve destek kartı (beğen · abone ol · zil). Ders içeriği yok; bileşenlerin nasıl çağrıldığını gösterir.
//   node motor/render.mjs ornek-yatay
import { destekKarti, destekGoster } from '/motor/sayfa/destek.js';
export function kur({ tl, B, sahne, KANAL }) {
  const g = B.katman(sahne, 'acilis');
  const gecis = B.acilisGecis(tl, g, 0.2, 1.0);
  const kun = B.dersKunyesi(g, { no: 1, ad: `Merhaba, ${KANAL.ad}`, soru: 'Kurulum denemesi' });
  B.dersKunyesiGoster(tl, kun, 0.6, { soruT: 1.4, son: 3.0, gecis });
  const kart = B.bolumKarti(sahne, { no: 1, baslik: 'İlk bölüm', ders: 1 }); B.kartGoster(tl, kart, 3.3, 5.0);
  const A = B.katman(sahne, 'zincir');
  const z = B.zincir(A, ['fikir', 'metin', 'ses', 'video'], { x: 300, y: 480 }); B.zincirAc(tl, z, 5.2);
  tl.to(A, { autoAlpha: 0, y: -24, duration: 0.4 }, 7.4);
  const d = destekKarti(sahne, { ders: 1 });
  destekGoster(tl, d, 7.6, { tiklar: [['abone', 9.1], ['begen', 10.2], ['zil', 11.2]], t1: 13.6 });
}
