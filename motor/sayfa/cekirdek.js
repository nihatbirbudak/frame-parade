// Page core: timing (audio mix) + scene plan → word-locked event times → the project's scene code → a paused
// GSAP timeline. The render side only calls window.VIDEO.render(t) (deterministic: same t → same frame).
//   sahne.html?proje=<name>&parca=<name>[&t=12.5]
// Project folder (<projeler>/<project>/): proje.json (bicim: yatay = landscape | dikey = portrait), sahne.js (the kur function), optional
// metin.json + sahne.json (word-anchored events) and <part>.zaman.json (under cikti/ or in the project root).
import { KANAL } from './kimlik.js';
import * as B from './bilesen.js';

const q = new URLSearchParams(location.search);
const PROJE = q.get('proje'), PARCA = q.get('parca') || 'tam';
window.VIDEO = { hazir: false, hata: null, fps: 30 };
const norm = (s) => s.toLocaleLowerCase(KANAL.dil || 'tr').replace(/[^\p{L}\p{N}]/gu, '');
const KOKP = `/${KANAL.klasorler?.projeler || 'projeler'}/${PROJE}`;
// only files that exist are fetched (the engine's server lists them), so a project without optional files causes no 404s
const VAR = new Set(await fetch(`/__dosyalar?proje=${encodeURIComponent(PROJE)}`).then((r) => (r.ok ? r.json() : [])).catch(() => []));
const json = async (yollar, varsayilan) => { for (const y of yollar) { if (!VAR.has(y.slice(KOKP.length + 1))) continue; const r = await fetch(y); if (r.ok) return r.json(); } if (varsayilan !== undefined) return varsayilan; throw new Error(`file missing: ${yollar.join(' | ')}`); };

try {
  const PJ = await json([`${KOKP}/proje.json`], { bicim: 'yatay' });
  document.getElementById('bicim-css').href = PJ.bicim === 'dikey' ? 'dikey.css' : 'yatay.css';
  const Z = await json([`${KOKP}/cikti/${PARCA}.zaman.json`, `${KOKP}/${PARCA}.zaman.json`]);
  const P = await json([`${KOKP}/sahne.json`], { bloklar: {} });
  const M = await json([`${KOKP}/metin.json`], { bloklar: [] });
  // sentence boundaries: the metin.json sentences are matched to the overall word timings by word count
  const cumleler = {};
  for (const zb of Z.bloklar || []) {
    const mb = M.bloklar.find((b) => b.id === zb.id); if (!mb) continue;
    let wi = 0; cumleler[zb.id] = [];
    for (const c of mb.cumleler) {
      const n = c.split(/\s+/).length;
      cumleler[zb.id].push({ metin: c, t0: zb.kelimeler[wi].t0, t1: zb.kelimeler[wi + n - 1].t1, k: zb.kelimeler.slice(wi, wi + n) });
      wi += n;
    }
    if (wi !== zb.kelimeler.length) throw new Error(`${zb.id}: sentence words ${wi} ≠ audio words ${zb.kelimeler.length}`);
  }
  // event resolution: { id, k: word prefix, n?: which match (1-based), ofset?: seconds }
  const olaylar = {}, liste = [], eksik = [];
  for (const [blok, cl] of Object.entries(P.bloklar || {})) {
    if (!cumleler[blok]) continue;
    for (const c of cl) {
      const C = cumleler[blok][c.c];
      if (!C) { eksik.push(`${blok}#${c.c} no such sentence`); continue; }
      for (const o of c.olaylar) {
        const hedef = norm(o.k); let say = 0, bulunan = null;
        for (const w of C.k) if (norm(w.w).startsWith(hedef) && ++say === (o.n || 1)) { bulunan = w; break; }
        if (!bulunan) { eksik.push(`${o.id}: "${o.k}" not found in ${blok}#${c.c}`); continue; }
        const t = +(bulunan.t0 + (o.ofset || 0)).toFixed(3);
        olaylar[o.id] = t; liste.push({ id: o.id, blok, cumle: c.c, kelime: bulunan.w, t, ne: o.ne });
      }
    }
  }
  if (eksik.length) throw new Error('could not resolve the scene plan: ' + eksik.join(' | '));
  const an = (id) => { if (!(id in olaylar)) throw new Error(`no such event: ${id}`); return olaylar[id]; };
  const cumle = (blok, i) => cumleler[blok]?.[i];
  const blokZ = (id) => (Z.bloklar || []).find((b) => b.id === id);

  const sahne = document.getElementById('sahne');
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
  gsap.registerPlugin(DrawSVGPlugin);
  const mod = await import(`${KOKP}/sahne.js`);
  await mod.kur({ tl, an, cumle, blokZ, Z, P, B, sahne, KANAL, kartlar: Z.kartlar || [] });
  tl.set({}, {}, Z.toplam);                                           // timeline lasts until the end of the audio
  await document.fonts.ready;
  window.VIDEO = { hazir: true, hata: null, fps: 30, sure: Z.toplam, kare: Math.round(Z.toplam * 30), olaylar: liste,
    render: (t) => { tl.seek(t, true); B.sayacGuncelle(t); return t; } };
  const t0 = q.get('t'); window.VIDEO.render(t0 ? +t0 : 0);
  console.log(`[video] ${PROJE}/${PARCA} ready: ${Z.toplam} s, ${liste.length} events`);
} catch (e) {
  window.VIDEO.hata = e.message; console.error(e);
}
