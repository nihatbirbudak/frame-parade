// English subtitles: same cue count and timestamps as the Turkish altyazi.srt, text taken from <project>/ceviri-en.json.
// Each cue <= 2 lines x <= 42 characters (most balanced split on a word boundary). Script verification at the end.
//   node kalite/altyazi_en.mjs <project>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { proje } from '../ayar.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = proje(process.argv[2]);
const SATIR = 42;
const oku = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '').replace(/\r/g, '').trim().split(/\n\n+/).map((b) => {
  const l = b.split('\n'); return { no: l[0], zaman: l[1], metin: l.slice(2) };
});
const tr = oku(path.join(DIR, 'paket', 'altyazi.srt'));
const en = JSON.parse(fs.readFileSync(path.join(DIR, 'ceviri-en.json'), 'utf8'));
if (en.length !== tr.length) throw new Error(`cue count differs: TR ${tr.length}, EN ${en.length}`);

const bol2 = (m) => {
  if (m.length <= SATIR) return [m];
  const w = m.split(' '); let en = null;
  for (let k = 1; k < w.length; k++) {
    const a = w.slice(0, k).join(' '), b = w.slice(k).join(' ');
    if (a.length <= SATIR && b.length <= SATIR) { const f = Math.abs(a.length - b.length) - (/[,;:]$/.test(w[k - 1]) ? 12 : 0); if (!en || f < en.f) en = { f, a, b }; }
  }
  return en ? [en.a, en.b] : null;
};
const hatalar = [];
const cikti = tr.map((c, i) => {
  const m = en[i].trim();
  if (!m) hatalar.push(`${c.no}: empty`);
  const s = bol2(m);
  if (!s) { hatalar.push(`${c.no}: ${m.length} characters, does not fit in 2x${SATIR} lines: ${m}`); return null; }
  return `${c.no}\n${c.zaman}\n${s.join('\n')}\n`;
});
if (hatalar.length) { console.error(hatalar.join('\n')); process.exit(1); }
const OUT = path.join(DIR, 'paket', 'altyazi-en.srt');
fs.writeFileSync(OUT, cikti.join('\n'), 'utf8');

// verification: re-read the written file and compare cue by cue with TR
const geri = oku(OUT);
if (geri.length !== tr.length) throw new Error('verification: cue count mismatch');
let enUzun = 0;
geri.forEach((g, i) => {
  if (g.no !== tr[i].no) throw new Error(`verification: sequence no ${g.no} ≠ ${tr[i].no}`);
  if (g.zaman !== tr[i].zaman) throw new Error(`verification: timing ${g.no}: ${g.zaman} ≠ ${tr[i].zaman}`);
  if (g.metin.length < 1 || g.metin.length > 2) throw new Error(`verification: ${g.no} line count ${g.metin.length}`);
  for (const s of g.metin) { if (s.length > SATIR) throw new Error(`verification: ${g.no} line is ${s.length} characters`); enUzun = Math.max(enUzun, s.length); }
  if (g.metin.join(' ') !== en[i].trim()) throw new Error(`verification: ${g.no} text was altered`);
});
// Turkish letters in the English text are only a warning (proper names such as places or people may keep them)
const trHarf = geri.filter((g) => /[ğüşıöçĞÜŞİÖÇ]/.test(g.metin.join(' ')));
if (trHarf.length) console.log(`warning: Turkish letters in ${trHarf.length} English cue(s) (fine for proper names): ${trHarf.slice(0, 5).map((g) => g.no).join(', ')}`);
console.log(`altyazi-en.srt: ${geri.length} cues (TR ${tr.length}), ${geri.length} timestamps identical, longest line ${enUzun} characters`);
