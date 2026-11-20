// Destek kartı cümlesi: seçili sesle sürüm başına birkaç alım (farklı seed), kelime zamanlarıyla. Bir kez üretilir;
// dosya varsa yeniden üretilmez. Ölçüler (süre, hece/sn, virgül duraklaması) alımlar.json'a yazılır; seçim bu ölçülerle
// yapılır, son karar kulakta.
//   node ses/destek_ses.mjs <proje>   (cümleler: DESTEK_A / DESTEK_B ortam değişkenleri)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, tts, sesAyari, abonelik, SES_KIMLIGI, MODEL } from './eleven.mjs';
import { proje } from '../ayar.mjs';

const DERS = process.argv[2] || 'ornek';
const DIR = path.join(proje(DERS), 'destek', 'ses');
const SURUMLER = {
  A: process.env.DESTEK_A || 'Destek cümlesi A (kendi metninizi yazın)',
  B: process.env.DESTEK_B || 'Destek cümlesi B (isteğe bağlı)',
};
const HIZ = process.argv.includes('--hiz') ? Number(process.argv[process.argv.indexOf('--hiz') + 1]) : null;   // ör. 0.86 (yalnız bu kart; ders gövdesi varsayılan)
const SEEDLER = HIZ ? [11, 23] : [11, 23, 37];
const EK = HIZ ? `-h${Math.round(HIZ * 100)}` : '';
const hece = (s) => (s.toLocaleLowerCase('tr').match(/[aeıioöuüâîû]/g) || []).length;

const ayar = { ...(await sesAyari(SES_KIMLIGI)), ...(HIZ ? { speed: HIZ } : {}) };
const a0 = await abonelik(); console.log(`hesap kalan: ${a0.kalan}`);
const sonuc = {};
for (const [ad, metin] of Object.entries(SURUMLER)) {
  sonuc[ad] = { metin, hece: hece(metin), alimlar: [] };
  for (const seed of SEEDLER) {
    const mp3 = path.join(DIR, `${ad}-${seed}${EK}.mp3`), kj = mp3.replace(/\.mp3$/, '.kelimeler.json');
    let kelimeler;
    if (fs.existsSync(mp3) && fs.existsSync(kj)) kelimeler = JSON.parse(fs.readFileSync(kj, 'utf8')).kelimeler;
    else {
      const r = await tts({ sesId: SES_KIMLIGI, metin, model: MODEL, ayar, seed, cikti: mp3, is: `${PROJE}-destek-${ad}-${seed}${EK}`, not: `${PROJE} destek kartı ${ad}, seed ${seed}` });
      kelimeler = r.kelimeler; fs.writeFileSync(kj, JSON.stringify({ metin, seed, kelimeler }));
    }
    const ilk = kelimeler[0].t0, son = kelimeler[kelimeler.length - 1].t1;
    const vi = kelimeler.findIndex((w) => w.w.endsWith(','));
    const virgul = vi >= 0 ? +(kelimeler[vi + 1].t0 - kelimeler[vi].t1).toFixed(3) : null;
    const konusma = son - ilk;
    sonuc[ad].alimlar.push({ seed, dosya: path.relative(ROOT, mp3).split(path.sep).join('/'), sure: +son.toFixed(3), konusma: +konusma.toFixed(3),
      hece_sn: +(sonuc[ad].hece / konusma).toFixed(2), virgul_sn: virgul, kelimeler });
    console.log(`  ${ad}-${seed}${EK}: ${konusma.toFixed(2)} sn konuşma, ${(sonuc[ad].hece / konusma).toFixed(2)} hece/sn, virgül ${virgul} sn`);
  }
}
fs.writeFileSync(path.join(DIR, `alimlar${EK}.json`), JSON.stringify(sonuc, null, 1));
const a1 = await abonelik(); console.log(`hesap kalan: ${a1.kalan} (bu koşu ${a0.kalan - a1.kalan})`);
