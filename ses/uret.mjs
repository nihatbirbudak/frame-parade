// Generates the lesson audio block by block (generate-once rule). One request per block; cache key = text + voice + model + settings.
// Not regenerated if the key is unchanged. Record: <projeler>/<project>/ses/uretim.json; spend: ses/harcama.jsonl.
//   node ses/uret.mjs <project> kanca giris b1        (only the named blocks)
//   node ses/uret.mjs <project> --hepsi [--butce 15000]
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT, tts, sesAyari, abonelik, SES_KIMLIGI, MODEL } from './eleven.mjs';
import { proje } from '../ayar.mjs';

const [DERS, ...arg] = process.argv.slice(2);
const DIR = proje(DERS);
const metin = JSON.parse(fs.readFileSync(path.join(DIR, 'metin.json'), 'utf8'));
const KAYIT = path.join(DIR, 'ses', 'uretim.json');
const kayit = fs.existsSync(KAYIT) ? JSON.parse(fs.readFileSync(KAYIT, 'utf8')) : { ses: SES_KIMLIGI, model: MODEL, uretimler: {} };
const BUTCE = arg.includes('--butce') ? Number(arg[arg.indexOf('--butce') + 1]) : 15000;
const secili = arg.includes('--hepsi') ? metin.bloklar.map((b) => b.id) : arg.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a));

const ayar = await sesAyari(SES_KIMLIGI);
const ayarAnahtar = JSON.stringify(ayar);
console.log(`voice ${SES_KIMLIGI} · ${MODEL} · default settings ${ayarAnahtar}`);
const harcanan = Object.values(kayit.uretimler).reduce((a, u) => a + (u.kredi_olculen || 0), 0);
const gerekli = metin.bloklar.filter((b) => secili.includes(b.id)).reduce((a, b) => a + b.karakter, 0);
console.log(`credit measured earlier in this project ${harcanan}; this run at most ${gerekli} characters (≈ ${Math.round(gerekli * 0.5)} credits, assuming 0.5/character); budget ${BUTCE}`);
if (harcanan + gerekli * 0.5 > BUTCE) { console.error('BUDGET: the per-lesson limit would be exceeded, stopped'); process.exit(2); }
const a0 = await abonelik();
console.log(`account remaining: ${a0.kalan} / ${a0.limit}`);

for (const b of metin.bloklar.filter((x) => secili.includes(x.id))) {
  const anahtar = createHash('sha1').update([b.metin, SES_KIMLIGI, MODEL, ayarAnahtar].join('|')).digest('hex').slice(0, 12);
  const mp3 = path.join(DIR, 'ses', `${b.id}.mp3`);
  if (kayit.uretimler[b.id]?.anahtar === anahtar && fs.existsSync(mp3)) { console.log(`  ${b.id}: cached (${anahtar}), not generated`); continue; }
  const r = await tts({ sesId: SES_KIMLIGI, metin: b.metin, model: MODEL, ayar, cikti: mp3, is: `${DERS}-${b.id}`, not: `${DERS} ${b.id} single request` });
  fs.writeFileSync(mp3.replace(/\.mp3$/, '.kelimeler.json'), JSON.stringify({ blok: b.id, kelimeler: r.kelimeler }, null, 0));
  kayit.uretimler[b.id] = { anahtar, dosya: path.relative(DIR, mp3).split(path.sep).join('/'), karakter: b.karakter, sure: r.sure, kredi_olculen: r.kredi, t: new Date().toISOString() };
  fs.mkdirSync(path.dirname(KAYIT), { recursive: true });
  fs.writeFileSync(KAYIT, JSON.stringify({ ...kayit, ayar }, null, 1));
  console.log(`  ${b.id}: ${b.karakter} characters → ${r.sure?.toFixed(2)} s, credit ${r.kredi ?? '?'}, remaining ${r.kalan ?? '?'}`);
}
