// Captures the frame at given moments as PNG (visual check, storyboard, self-review).
//   node kalite/kare.mjs <project> <part> <output folder> [t1 t2 …] [--olaylar] [--her 2.5] [--olcek 0.5]
//   --olaylar: takes the frame 0.7 s after each event (the state after the transformation); --her N: every N seconds;
//   --olcek F: output image scaled by F (e.g. 0.5 → 960×540 for landscape) through the device pixel ratio; layout is unchanged
import fs from 'node:fs';
import path from 'node:path';
import { ac } from '../motor/lib.mjs';

const [PROJE, PARCA, CIK, ...arg] = process.argv.slice(2);
fs.mkdirSync(CIK, { recursive: true });
const { page, kapat, W, H } = await ac(`proje=${PROJE}&parca=${PARCA}`);
const info = await page.evaluate(() => ({ sure: window.VIDEO.sure, olaylar: window.VIDEO.olaylar }));
fs.writeFileSync(path.join(CIK, 'olaylar.json'), JSON.stringify(info.olaylar, null, 1));
let anlar = arg.filter((a) => /^\d+(\.\d+)?$/.test(a) && !['--her', '--olcek'].includes(arg[arg.indexOf(a) - 1])).map(Number);
if (arg.includes('--olaylar')) anlar.push(...info.olaylar.map((o) => +(o.t + 0.7).toFixed(2)));
if (arg.includes('--her')) { const n = Number(arg[arg.indexOf('--her') + 1]); for (let t = 0; t < info.sure; t += n) anlar.push(+t.toFixed(2)); }
const olcek = arg.includes('--olcek') ? Number(arg[arg.indexOf('--olcek') + 1]) : 1;
if (!(olcek > 0 && olcek <= 4)) throw new Error('--olcek must be between 0 and 4');
if (olcek !== 1) await page.setViewport({ width: W, height: H, deviceScaleFactor: olcek });
anlar = [...new Set(anlar)].sort((a, b) => a - b);
const t0 = Date.now();
let n = 0;
for (const t of anlar) {
  await page.evaluate((t) => window.VIDEO.render(t), t);
  const ad = path.join(CIK, arg.includes('--sirali') ? `n${String(++n).padStart(4, '0')}.png` : `t${String(t.toFixed(2)).padStart(7, '0')}.png`);
  await page.screenshot({ path: ad, type: 'png' });
}
console.log(`${anlar.length} frames → ${CIK} (${((Date.now() - t0) / 1000).toFixed(1)} s); duration ${info.sure} s, ${info.olaylar.length} events`);
await kapat();
