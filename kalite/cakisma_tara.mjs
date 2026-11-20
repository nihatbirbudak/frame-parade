// Overflow/overlap scan: every N seconds it collects the visible text boxes (.y, .cip, .kutu .et) in each frame and flags:
// (1) two texts overlapping (intersection > 4 px x 4 px); (2) text outside the safe area (x < 96, x > 1824,
// y < 40, y > 960); (3) text crossing the long horizontal/vertical lines in the scene (path, straight segment >= 300 px), e.g. a tank floor.
//   node motor/cakisma_tara.mjs <project> <part> [interval 2] [--haric "text"]
import { ac } from '../motor/lib.mjs';
const [PROJE, PARCA, ARA = 2] = process.argv.slice(2);
const HARIC = process.argv.includes('--haric') ? process.argv[process.argv.indexOf('--haric') + 1] : null;
const { page, kapat } = await ac(`proje=${PROJE}&parca=${PARCA}`);
const sure = await page.evaluate(() => window.VIDEO.sure);
const sonuc = await page.evaluate(async (ara, sure, haric) => {
  const gor = (e) => {
    let o = 1, n = e;
    while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return false; o *= +cs.opacity; n = n.parentElement; }
    if (o < 0.5) return false;
    const cp = getComputedStyle(e).clipPath; if (cp && cp !== 'none') { const v = (cp.match(/-?[\d.]+%/g) || []).map(parseFloat); if (v.some((x) => x > 2)) return false; }
    return true;
  };
  // the real ink box of the text: the text node via Range (for box .et, the text box rather than the element box)
  const kutuAl = (e) => { const r = document.createRange(); r.selectNodeContents(e.childNodes[0] || e); const b = r.getBoundingClientRect(); return b.width ? b : e.getBoundingClientRect(); };
  const cizgiler = () => {
    const out = [];
    for (const p of document.querySelectorAll('svg path')) {
      if (!gor(p)) continue; const cs = getComputedStyle(p); if (cs.strokeOpacity === '0' || !p.getAttribute('d')) continue;
      // DrawSVG: a path that is not drawn yet or only partly drawn (first dasharray value < 95% of the length) is ignored
      const da = cs.strokeDasharray; if (da && da !== 'none') { const v = da.split(/[ ,]+/).map(parseFloat); const L = p.getTotalLength(); if (v.length === 2 && v[0] < L * 0.95 && v[1] > L * 0.5) continue; }
      const m = p.getCTM(); if (!m) continue;
      const d = p.getAttribute('d'); const nok = [...d.matchAll(/([ML])\s*(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((x) => ({ k: x[1], x: +x[2], y: +x[3] }));
      for (let i = 1; i < nok.length; i++) { if (nok[i].k !== 'L') continue; const a = nok[i - 1], b = nok[i];
        const A = { x: m.a * a.x + m.c * a.y + m.e, y: m.b * a.x + m.d * a.y + m.f }, Bp = { x: m.a * b.x + m.c * b.y + m.e, y: m.b * b.x + m.d * b.y + m.f };
        if (Math.abs(A.y - Bp.y) < 1 && Math.abs(A.x - Bp.x) >= 300) out.push({ yatay: true, y: A.y, x0: Math.min(A.x, Bp.x), x1: Math.max(A.x, Bp.x) });
        if (Math.abs(A.x - Bp.x) < 1 && Math.abs(A.y - Bp.y) >= 300) out.push({ yatay: false, x: A.x, y0: Math.min(A.y, Bp.y), y1: Math.max(A.y, Bp.y) }); }
    }
    return out;
  };
  const kayit = [];
  for (let t = 0; t <= sure; t += ara) {
    window.VIDEO.render(t);
    const els = [...document.querySelectorAll('.y, .cip, .kutu .et')].filter((e) => e.textContent.trim() && gor(e) && !(haric && e.textContent.includes(haric)));
    const R = els.map((e) => ({ e, b: kutuAl(e), y: e.textContent.trim().slice(0, 28) }));
    for (let i = 0; i < R.length; i++) {
      const a = R[i].b;
      if (a.left < 96 - 2 || a.right > 1824 + 2 || a.top < 40 || a.bottom > 960) kayit.push({ t, tur: 'outside safe area', yazi: R[i].y, kutu: [a.left, a.top, a.right, a.bottom].map(Math.round) });
      for (let j = i + 1; j < R.length; j++) { const b = R[j].b; if (R[i].e.contains(R[j].e) || R[j].e.contains(R[i].e)) continue;
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 4 && h > 4) kayit.push({ t, tur: 'text overlap', yazi: `${R[i].y} ↔ ${R[j].y}`, alan: Math.round(w) + '×' + Math.round(h) }); }
    }
    for (const c of cizgiler()) for (const r of R) { const b = r.b;
      if (c.yatay && c.y > b.top + 3 && c.y < b.bottom - 3 && b.right > c.x0 && b.left < c.x1) kayit.push({ t, tur: 'crosses a line', yazi: r.y, cizgi: `y=${Math.round(c.y)}` });
      if (!c.yatay && c.x > b.left + 3 && c.x < b.right - 3 && b.bottom > c.y0 && b.top < c.y1) kayit.push({ t, tur: 'crosses a line', yazi: r.y, cizgi: `x=${Math.round(c.x)}` }); }
  }
  return kayit;
}, Number(ARA), sure, HARIC);
await kapat();
const ozet = {}; for (const k of sonuc) { const a = `${k.tur} · ${k.yazi}${k.cizgi ? ' · ' + k.cizgi : ''}`; (ozet[a] ||= []).push(k.t); }
console.log(`scan: ${Math.floor(sure / ARA) + 1} frames (${ARA} s apart), findings ${sonuc.length}, distinct ${Object.keys(ozet).length}`);
for (const [a, ts] of Object.entries(ozet)) console.log(`  ${a}  @ ${ts.map((t) => t.toFixed(0)).join(',')}`);
