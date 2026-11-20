// Lesson audio mix: pulls the blocks to the tempo target (atempo locally, within ±8%), trims leading/trailing silence, inserts the chapter-card
// gaps in between, applies an 80 Hz high-pass + a two-pass loudnorm (−14 LUFS / −1.5 dBTP); writes the overall word timings.
//   node ses/ses_kur.mjs <project> <part> kanca,giris,b1      → <projeler>/<project>/cikti/dilim1.wav + dilim1.zaman.json
// Timeline rules: 0.5 s at the start; 1.0 s after the hook; a 2.2 s card gap before a titled block (chapter);
// 2.0 s at the end. Syllables/s target 5.2 (range 5.0–5.4).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './eleven.mjs';
import { GECICI, proje } from '../ayar.mjs';
import { FF, sessizlik } from './olc.mjs';

const [DERS, AD, liste] = process.argv.slice(2);
const DIR = proje(DERS);
const OUT = path.join(DIR, 'cikti'); fs.mkdirSync(OUT, { recursive: true });
const TMP = path.join(GECICI, DERS, 'ses-tmp'); fs.mkdirSync(TMP, { recursive: true });
const metin = JSON.parse(fs.readFileSync(path.join(DIR, 'metin.json'), 'utf8'));
const HEDEF = 5.2, SR = 48000;
const BAS = 0.5, KANCA_SONRA = 1.0, KART = 2.2, SON = Number(process.env.SON_SN || 2.0);   // full lesson: SON_SN=20 (end screen)
// vowel count; the vowel set is Turkish-specific (ı, ö, ü, circumflexed vowels)
const unlu = (s) => (s.toLocaleLowerCase('tr').match(/[aeıioöuüâîû]/g) || []).length;
const run = (args) => { const r = spawnSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' }); if (r.status) throw new Error(r.stderr); return r; };

const ids = liste.split(',');
const parcalar = [], zaman = { ders: DERS, ad: AD, hedef_hece_sn: HEDEF, bloklar: [], kartlar: [] };
let t = BAS;
parcalar.push({ sessiz: BAS });
ids.forEach((id, i) => {
  const b = metin.bloklar.find((x) => x.id === id);
  if (i > 0 && b.baslik && b.id !== 'giris') { zaman.kartlar.push({ blok: id, baslik: b.baslik, t0: +t.toFixed(3), t1: +(t + KART).toFixed(3) }); parcalar.push({ sessiz: KART }); t += KART; }
  // optional (metin.json): bosluk_once = silence before the block (an untitled continuation block, the support card); otherwise the behaviour is the same
  else if (i > 0 && b.bosluk_once) { parcalar.push({ sessiz: b.bosluk_once }); t += b.bosluk_once; }
  const mp3 = path.join(DIR, 'ses', `${id}.mp3`);
  const s = sessizlik(mp3);
  const kirpBas = Math.max(0, s.konusmaBas - 0.06), kirpSon = Math.min(s.sure, s.konusmaSon + 0.12);
  const olculen = unlu(b.metin) / (s.konusmaSon - s.konusmaBas);
  let at = HEDEF / olculen; at = Math.min(1.08, Math.max(0.92, at));
  if (b.atempo) at = b.atempo;                                       // optional: a ready-made mix (support card) is not tempo-adjusted
  const wav = path.join(TMP, `${id}.wav`);
  run(['-i', mp3, '-af', `atrim=${kirpBas.toFixed(3)}:${kirpSon.toFixed(3)},asetpts=PTS-STARTPTS,aresample=${SR},atempo=${at.toFixed(4)}`, '-ac', '1', '-c:a', 'pcm_f32le', wav]);
  const sure = (kirpSon - kirpBas) / at;
  const kel = JSON.parse(fs.readFileSync(mp3.replace(/\.mp3$/, '.kelimeler.json'), 'utf8')).kelimeler;
  zaman.bloklar.push({ id, baslik: b.baslik, t0: +t.toFixed(3), t1: +(t + sure).toFixed(3), atempo: +at.toFixed(4), olculen_hece_sn: +olculen.toFixed(2), sonra_hece_sn: +(olculen * at).toFixed(2),
    kelimeler: kel.map((k) => ({ w: k.w, t0: +(t + (k.t0 - kirpBas) / at).toFixed(3), t1: +(t + (k.t1 - kirpBas) / at).toFixed(3) })) });
  parcalar.push({ dosya: wav });
  t += sure;
  if (id === 'kanca') { parcalar.push({ sessiz: KANCA_SONRA }); t += KANCA_SONRA; }
});
parcalar.push({ sessiz: SON }); t += SON;
zaman.toplam = +t.toFixed(3);

// concatenate
const girdiler = [], fc = [];
parcalar.forEach((p, i) => {
  if (p.dosya) girdiler.push('-i', p.dosya);
  else girdiler.push('-f', 'lavfi', '-t', p.sessiz.toFixed(3), '-i', `anullsrc=r=${SR}:cl=mono`);
  fc.push(`[${i}:a]aformat=sample_fmts=fltp:sample_rates=${SR}:channel_layouts=mono[a${i}]`);
});
fc.push(`${parcalar.map((_, i) => `[a${i}]`).join('')}concat=n=${parcalar.length}:v=0:a=1,highpass=f=80[out]`);
const ham = path.join(TMP, `${AD}_ham.wav`);
run([...girdiler, '-filter_complex', fc.join(';'), '-map', '[out]', '-c:a', 'pcm_f32le', ham]);

// two-pass loudnorm
const LN = 'I=-14:TP=-1.5:LRA=11';
const js = (txt) => JSON.parse(txt.slice(txt.lastIndexOf('{'), txt.lastIndexOf('}') + 1));
const m = js(spawnSync(FF, ['-hide_banner', '-nostats', '-i', ham, '-af', `loudnorm=${LN}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr);
const son = path.join(OUT, `${AD}.wav`);
const r2 = spawnSync(FF, ['-y', '-hide_banner', '-nostats', '-i', ham, '-af', `loudnorm=${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json,aresample=${SR}`, '-ac', '2', '-c:a', 'pcm_s16le', son], { encoding: 'utf8' });
const m2 = js(r2.stderr);
zaman.ses = { dosya: path.relative(DIR, son).split(path.sep).join('/'), giris_lufs: +m.input_i, giris_tepe: +m.input_tp, cikis_lufs: +m2.output_i, cikis_tepe: +m2.output_tp, yol: m2.normalization_type };
fs.writeFileSync(path.join(OUT, `${AD}.zaman.json`), JSON.stringify(zaman));
console.log(`${AD}: ${zaman.toplam.toFixed(2)} s · ${zaman.bloklar.map((b) => `${b.id} ${b.olculen_hece_sn}→${b.sonra_hece_sn} (atempo ${b.atempo})`).join(' · ')}`);
console.log(`loudness ${m.input_i} → ${m2.output_i} LUFS, peak ${m.input_tp} → ${m2.output_tp} dBTP (${m2.normalization_type})`);
