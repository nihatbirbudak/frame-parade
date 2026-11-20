// Subtitles: builds an SRT from the narration text (metin.json sentences) and the word timings (<part>.zaman.json).
// Rules: line <= 42 characters, cue at most 2 lines; a cue ends at a comma/semicolon/colon where possible, a single word
// is never left dangling at the end; a cue lasts at least 1 s and ends 40 ms before the next one. Final script check: subtitle text matches the narration exactly.
// If the project has ceviri-en.json (an array of the same length, in the same order as the Turkish cues), an English SRT is also written with the same timestamps.
//   node kalite/altyazi.mjs <project> [part=tam]   → projeler/<project>/paket/altyazi.srt (+ altyazi-en.srt)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { proje } from '../ayar.mjs';

const [PROJE, PARCA = 'tam'] = process.argv.slice(2);
if (!PROJE) { console.log('Usage: node kalite/altyazi.mjs <project> [part]'); process.exit(2); }
const DIR = proje(PROJE), OUT = path.join(DIR, 'paket'); fs.mkdirSync(OUT, { recursive: true });
const zf = [path.join(DIR, 'cikti', `${PARCA}.zaman.json`), path.join(DIR, `${PARCA}.zaman.json`)].find((f) => fs.existsSync(f));
if (!zf) { console.log(`timing file missing: cikti/${PARCA}.zaman.json (produced by ses/ses_kur.mjs)`); process.exit(1); }
const Z = JSON.parse(fs.readFileSync(zf, 'utf8'));
const M = JSON.parse(fs.readFileSync(path.join(DIR, 'metin.json'), 'utf8'));
const zs = (s) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sn = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sn).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };

const SATIR = 42, cues = [];
// most balanced split into two lines (each line <= SATIR; breaking after a comma gets a 12-character bonus); null if it does not fit
const bol2 = (par) => { const m = par.join(' '); if (m.length <= SATIR) return [m]; let en = null;
  for (let k = 1; k < par.length; k++) { const a = par.slice(0, k).join(' '), b = par.slice(k).join(' '); if (a.length <= SATIR && b.length <= SATIR) { const f = Math.abs(a.length - b.length) - (/[,;]$/.test(par[k - 1]) ? 12 : 0); if (!en || f < en.f) en = { f, a, b }; } }
  return en ? [en.a, en.b] : null; };
for (const zb of Z.bloklar || []) {
  const mb = M.bloklar.find((b) => b.id === zb.id); if (!mb) throw new Error(`no such block in metin.json: ${zb.id}`);
  let wi = 0;
  for (const c of mb.cumleler) {
    const ws = c.split(/\s+/), kz = zb.kelimeler.slice(wi, wi + ws.length); wi += ws.length;
    let bas = 0;
    while (bas < ws.length) {
      let son = bas + 1;
      for (let e = ws.length; e > bas; e--) if (bol2(ws.slice(bas, e))) { son = e; break; }
      if (son < ws.length) { for (let k = son - 1; k >= bas + 2; k--) if (/[,;:]$/.test(ws[k]) && bol2(ws.slice(k + 1, Math.min(ws.length, k + 1 + 40))) !== undefined) { son = k + 1; break; } }
      if (ws.length - son === 1 && son - bas > 2 && bol2(ws.slice(son - 1))) son -= 1;
      const par = ws.slice(bas, son);
      cues.push({ t0: kz[bas].t0, t1: kz[son - 1].t1, metin: (bol2(par) || [par.join(' ')]).join('\n') });
      bas = son;
    }
  }
}
for (let i = 0; i < cues.length; i++) { const c = cues[i], n = cues[i + 1]; c.t1 = Math.max(c.t1 + 0.25, c.t0 + 1.0); if (n && c.t1 > n.t0 - 0.04) c.t1 = n.t0 - 0.04; }
fs.writeFileSync(path.join(OUT, 'altyazi.srt'), cues.map((c, i) => `${i + 1}\n${zs(c.t0)} --> ${zs(c.t1)}\n${c.metin}\n`).join('\n'), 'utf8');
const srtMetin = cues.map((c) => c.metin.replace(/\n/g, ' ')).join(' ').replace(/\s+/g, ' ');
const sesMetin = (Z.bloklar || []).map((zb) => M.bloklar.find((b) => b.id === zb.id).cumleler.join(' ')).join(' ').replace(/\s+/g, ' ');
if (srtMetin !== sesMetin) throw new Error('subtitle text does not match the narration text exactly');
const maxS = cues.length ? Math.max(...cues.map((c) => Math.max(...c.metin.split('\n').map((s) => s.length)))) : 0;
console.log(`altyazi.srt: ${cues.length} cues, longest line ${maxS} characters; text matches the narration exactly`);
if (fs.existsSync(path.join(DIR, 'ceviri-en.json'))) {
  const r = spawnSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'altyazi_en.mjs'), PROJE], { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
