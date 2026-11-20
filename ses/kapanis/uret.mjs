// Standart Shorts abone kapanışı: tek cümle BİR KEZ seçili sesle üretilir ve sabit dosya olur. Her Shorts'ta aynı dosya
// kullanılır. Dosya varsa yeniden üretilmez.
//   node ses/kapanis/uret.mjs "<cümle aynen>"
// Çıktı: abone.mp3 (ham), abone.wav (48 kHz stereo, tempo 5,2 hece/sn'ye ±%8, −14 LUFS, tepe ≤ −1 dBTP, baş 0,05 / son 0,25 sn pay),
// abone.kelimeler.json (metin + wav zamanında kelimeler).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tts, sesAyari, abonelik, SES_KIMLIGI, MODEL } from '../eleven.mjs';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..', '..');
import ffmpegYolu from 'ffmpeg-static';
const FF = ffmpegYolu;
const ff = (a) => { const r = spawnSync(FF, ['-hide_banner', '-y', ...a], { encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr.slice(-1500)); return r.stderr; };
const olc = (f) => { const e = ff(['-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-']); const o = e.slice(e.lastIndexOf('Summary:')); return { I: +o.match(/I:\s+(-?[\d.]+) LUFS/)[1], TP: +o.match(/Peak:\s+(-?[\d.]+) dBFS/)[1] }; };
const METIN = (process.argv[2] || '').trim();
if (!METIN) throw new Error('cümle verilmedi');
const MP3 = path.join(DIR, 'abone.mp3'), HAMK = path.join(DIR, 'abone.ham.json');
if (!fs.existsSync(MP3)) {
  const ayar = await sesAyari(SES_KIMLIGI); const a0 = await abonelik();
  const r = await tts({ sesId: SES_KIMLIGI, metin: METIN, model: MODEL, ayar, cikti: MP3, is: 'shorts-kapanis', not: 'Standart Shorts abone kapanışı, tek sefer' });
  fs.writeFileSync(HAMK, JSON.stringify({ metin: METIN, kelimeler: r.kelimeler, kalan_once: a0.kalan }, null, 1));
  console.log('üretildi, süre', r.sure);
} else console.log('abone.mp3 var, üretilmedi');
const H = JSON.parse(fs.readFileSync(HAMK, 'utf8'));
if (H.metin !== METIN) throw new Error('kayıtlı ses başka bir metinle üretilmiş; yeni metin için dosyaları elle kaldırın');
const K = H.kelimeler, unlu = (s) => (s.toLocaleLowerCase('tr').match(/[aeıioöuüâîû]/g) || []).length;
const span = K[K.length - 1].t1 - K[0].t0, hs = unlu(METIN) / span;
const tempo = +Math.min(1.08, Math.max(0.92, 5.2 / hs)).toFixed(4);
const a = Math.max(0, K[0].t0 - 0.05), b = K[K.length - 1].t1 + 0.25;
const ham = path.join(DIR, 'abone.ara.wav'), wav = path.join(DIR, 'abone.wav');
ff(['-ss', a.toFixed(3), '-to', b.toFixed(3), '-i', MP3, '-af', `atempo=${tempo},afade=t=in:d=0.008,areverse,afade=t=in:d=0.03,areverse,aresample=48000`, '-ac', '2', '-c:a', 'pcm_s16le', ham]);
let kaz = -14 - olc(ham).I;
ff(['-i', ham, '-af', `volume=${kaz.toFixed(2)}dB,alimiter=limit=0.8:attack=1:release=60:level=0`, '-c:a', 'pcm_s16le', wav]); fs.unlinkSync(ham);
const L = olc(wav);
const kelimeler = K.map((w) => ({ w: w.w, t0: +((w.t0 - a) / tempo).toFixed(3), t1: +((w.t1 - a) / tempo).toFixed(3) }));
fs.writeFileSync(path.join(DIR, 'abone.kelimeler.json'), JSON.stringify({ metin: METIN, tempo, hece_sn_ham: +hs.toFixed(2), hece_sn: +(hs * tempo).toFixed(2), sure_sn: +((b - a) / tempo).toFixed(3), lufs: L.I, tepe_dbtp: L.TP, kelimeler }, null, 1));
console.log(`abone.wav: ${((b - a) / tempo).toFixed(2)} sn · hece/sn ${hs.toFixed(2)} → ${(hs * tempo).toFixed(2)} · ${L.I} LUFS · tepe ${L.TP} dBTP`);
