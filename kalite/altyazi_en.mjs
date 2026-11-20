// İngilizce altyazı: Türkçe altyazi.srt'nin parça sayısı ve zaman damgaları aynen, metin <proje>/ceviri-en.json'dan.
// Her parça ≤ 2 satır × ≤ 42 karakter (kelime sınırında en dengeli bölüm). Sonda betik doğrulaması.
//   node kalite/altyazi_en.mjs <proje>
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
if (en.length !== tr.length) throw new Error(`parça sayısı farklı: TR ${tr.length}, EN ${en.length}`);

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
  if (!m) hatalar.push(`${c.no}: boş`);
  const s = bol2(m);
  if (!s) { hatalar.push(`${c.no}: ${m.length} karakter, 2×${SATIR} satıra sığmıyor: ${m}`); return null; }
  return `${c.no}\n${c.zaman}\n${s.join('\n')}\n`;
});
if (hatalar.length) { console.error(hatalar.join('\n')); process.exit(1); }
const OUT = path.join(DIR, 'paket', 'altyazi-en.srt');
fs.writeFileSync(OUT, cikti.join('\n'), 'utf8');

// doğrulama: yazılan dosyayı yeniden oku, TR ile parça parça karşılaştır
const geri = oku(OUT);
if (geri.length !== tr.length) throw new Error('doğrulama: parça sayısı tutmuyor');
let enUzun = 0;
geri.forEach((g, i) => {
  if (g.no !== tr[i].no) throw new Error(`doğrulama: sıra no ${g.no} ≠ ${tr[i].no}`);
  if (g.zaman !== tr[i].zaman) throw new Error(`doğrulama: zaman ${g.no}: ${g.zaman} ≠ ${tr[i].zaman}`);
  if (g.metin.length < 1 || g.metin.length > 2) throw new Error(`doğrulama: ${g.no} satır sayısı ${g.metin.length}`);
  for (const s of g.metin) { if (s.length > SATIR) throw new Error(`doğrulama: ${g.no} satır ${s.length} karakter`); enUzun = Math.max(enUzun, s.length); }
  if (g.metin.join(' ') !== en[i].trim()) throw new Error(`doğrulama: ${g.no} metin bozuldu`);
});
if (/[ğüşıöçĞÜŞİÖÇ]/.test(geri.map((g) => g.metin.join(' ')).join(' '))) throw new Error('doğrulama: İngilizce metinde Türkçe harf kaldı');
console.log(`altyazi-en.srt: ${geri.length} parça (TR ${tr.length}), ${geri.length} zaman damgası birebir aynı, en uzun satır ${enUzun} karakter`);
