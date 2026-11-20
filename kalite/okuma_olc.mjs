// Okuma süresi ölçümü: sayfa 0,1 sn aralıkla örneklenir; her yazı öğesinin (.y, .cip, .kutu .et) tam görünür (opaklık
// ≥ 0,9, kırpmasız, ekranda) kaldığı en uzun kesintisiz süre hesaplanır. Sonuç: en kısa süreler ve eşik (0,6 sn) altı.
//   node motor/okuma_olc.mjs <proje> <parça> [baş sn] [son sn]
import { ac } from '../motor/lib.mjs';
const [PROJE, PARCA, A = 0, Bs] = process.argv.slice(2);
const { page, kapat } = await ac(`proje=${PROJE}&parca=${PARCA}`);
const sure = await page.evaluate(() => window.VIDEO.sure);
const r = await page.evaluate(async (a, b) => {
  const els = [...document.querySelectorAll('.y, .cip, .kutu .et')].filter((e) => e.textContent.trim());
  const gorunur = (e) => {
    let o = 1, n = e;
    while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return false; o *= +cs.opacity; n = n.parentElement; }
    if (o < 0.9) return false;
    const cp = getComputedStyle(e).clipPath; if (cp && cp !== 'none') { const v = (cp.match(/-?[\d.]+%/g) || []).map(parseFloat); if (v.some((x) => x > 2)) return false; }
    const rc = e.getBoundingClientRect(); return rc.width > 0 && rc.right > 0 && rc.left < 1920 && rc.bottom > 0 && rc.top < 1080;
  };
  const ac = new Map(), en = new Map();
  for (let t = a; t <= b; t += 0.1) {
    window.VIDEO.render(t);
    for (const e of els) { const g = gorunur(e); if (g) { if (!ac.has(e)) ac.set(e, t); } else if (ac.has(e)) { const d = t - ac.get(e); en.set(e, Math.max(en.get(e) || 0, d)); ac.delete(e); } }
  }
  for (const [e, t0] of ac) en.set(e, Math.max(en.get(e) || 0, b - t0));
  return [...en].map(([e, d]) => ({ y: e.textContent.trim().slice(0, 40), d: +d.toFixed(1) })).sort((x, y) => x.d - y.d);
}, Number(A), Number(Bs || sure));
await kapat();
const alt = r.filter((x) => x.d < 0.6);
console.log(JSON.stringify({ aralik: [Number(A), Number(Bs || sure)], yazi: r.length, en_kisa: r.slice(0, 8), esik_alti: alt }, null, 1));
