// Audio measurement: syllables/s (vowel count ÷ speech duration; two sources:
// the first/last audible moment in the file and the ElevenLabs word times), total internal pause (silencedetect −38 dB, >= 0.12 s),
// longest pause, integrated loudness (LUFS), true peak (dBTP), LRA. What is measured, not what is heard.
//   node ses/olc.mjs <project> kanca giris b1
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './eleven.mjs';
import { GECICI, proje, heceSay } from '../ayar.mjs';

import ffmpegYolu from 'ffmpeg-static';
export const FF = ffmpegYolu;
// vowel count; the vowel set is Turkish-specific (ı, ö, ü, circumflexed vowels)
const unlu = (s) => heceSay(s);   // syllables by kanal.dil (ayar.mjs)
const ff = (args) => spawnSync(FF, ['-hide_banner', ...args], { encoding: 'utf8' }).stderr || '';
const f2 = (x, n = 2) => (x == null || Number.isNaN(x) ? null : +x.toFixed(n));

export function sessizlik(mp3) {
  const e = ff(['-i', mp3, '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-']);
  const sure = (e.match(/Duration: (\d+):(\d+):([\d.]+)/) || []).slice(1).reduce((a, v, i) => a + (+v) * [3600, 60, 1][i], 0);
  const baslar = [...e.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, +m[1]));
  const bitisler = [...e.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map((m) => ({ b: +m[1], d: +m[2] }));
  const ar = baslar.map((s, i) => ({ t0: s, t1: bitisler[i] ? bitisler[i].b : sure, d: bitisler[i] ? bitisler[i].d : sure - s }));
  const bas = ar.find((a) => a.t0 < 0.02);
  const son = ar.length && ar[ar.length - 1].t1 >= sure - 0.05 ? ar[ar.length - 1] : null;
  const konusmaBas = bas ? bas.t1 : 0, sonS = son && son !== bas ? son : null, konusmaSon = sonS ? sonS.t0 : sure;
  return { sure, konusmaBas, konusmaSon, ic: ar.filter((a) => a !== bas && a !== sonS) };
}
export function yukseklik(dosya) {
  const e = ff(['-i', dosya, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const oz = e.slice(e.lastIndexOf('Summary:'));
  return { lufs: +((oz.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1]), tepe_dbtp: +((oz.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1]), lra: +((oz.match(/LRA:\s+(-?[\d.]+) LU/) || [])[1]) };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('olc.mjs')) {
  const [DERS, ...bl] = process.argv.slice(2);
  const DIR = proje(DERS);
  const metin = JSON.parse(fs.readFileSync(path.join(DIR, 'metin.json'), 'utf8'));
  const sonuc = {};
  for (const id of bl) {
    const b = metin.bloklar.find((x) => x.id === id), mp3 = path.join(DIR, 'ses', `${id}.mp3`);
    const kel = JSON.parse(fs.readFileSync(mp3.replace(/\.mp3$/, '.kelimeler.json'), 'utf8')).kelimeler;
    const s = sessizlik(mp3), y = yukseklik(mp3), h = unlu(b.metin);
    const sd = s.konusmaSon - s.konusmaBas, sk = kel[kel.length - 1].t1 - kel[0].t0;
    const icTop = s.ic.reduce((a, v) => a + v.d, 0);
    sonuc[id] = { hece: h, kelime: kel.length, metin_kelime: b.metin.split(/\s+/).length, dosya_sure: f2(s.sure), konusma_sure: f2(sd),
      hece_sn_dosya: f2(h / sd), hece_sn_kelime: f2(h / sk), hece_sn_duraksiz: f2(h / (sd - icTop)),
      ic_duraklama_toplam: f2(icTop), duraklama_orani: f2(icTop / sd, 3), en_uzun_duraklama: f2(Math.max(0, ...s.ic.map((a) => a.d))), duraklama_sayisi: s.ic.length,
      bas_sessizlik: f2(s.konusmaBas), son_sessizlik: f2(s.sure - s.konusmaSon), ...y };
  }
  const OUT = path.join(DIR, 'ses', 'olcum.json');
  const eski = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  fs.writeFileSync(OUT, JSON.stringify({ ...eski, ...sonuc }, null, 1));
  console.log('block    syll  dur    syll/s(file)   (words)  (no pause)  pause      longest  LUFS    peak dBTP');
  for (const [id, r] of Object.entries(sonuc)) console.log(`${id.padEnd(8)} ${String(r.hece).padStart(4)} ${String(r.konusma_sure).padStart(6)}  ${String(r.hece_sn_dosya).padStart(8)}  ${String(r.hece_sn_kelime).padStart(8)}  ${String(r.hece_sn_duraksiz).padStart(8)}   ${String(r.ic_duraklama_toplam).padStart(5)} (%${(r.duraklama_orani * 100).toFixed(0)})  ${String(r.en_uzun_duraklama).padStart(5)}  ${r.lufs}  ${r.tepe_dbtp}`);
}
