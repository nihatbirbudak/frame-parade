// Render: headless Chrome frames → ffmpeg (libx264) + audio. Format comes from the project's proje.json › bicim field (yatay = landscape / dikey = portrait), 30 fps.
//   node motor/render.mjs <project> [part=tam] [--sub 2] [--crf 18] [--from 0 --to 300] [--olcek 0.5 (animatic)]
// Output: <projeler>/<project>/cikti/<part>.mp4 (+ .render.json). Audio: cikti/<part>.wav; if missing, a silent audio track (test).
// --sub N: N sub-frames per frame (180° shutter motion blur, tmix); 1 = no blur.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { ac, FFMPEG } from './lib.mjs';
import { proje } from '../ayar.mjs';

const arg = process.argv.slice(2);
const [PROJE, PARCA = 'tam'] = arg.filter((a, i) => !a.startsWith('--') && !(i > 0 && arg[i - 1].startsWith('--')));
if (!PROJE) { console.log('Usage: node motor/render.mjs <project> [part]'); process.exit(2); }
const opt = (k, d) => (arg.includes(k) ? Number(arg[arg.indexOf(k) + 1]) : d);
const SUB = opt('--sub', 1), CRF = opt('--crf', 18), OLCEK = opt('--olcek', 1);
const DIR = path.join(proje(PROJE), 'cikti'); fs.mkdirSync(DIR, { recursive: true });
const OUT = path.join(DIR, `${PARCA}${OLCEK !== 1 ? '-animatik' : ''}.mp4`), TMP = OUT.replace(/\.mp4$/, '.tmp.mp4');
const WAV = path.join(DIR, `${PARCA}.wav`), SESLI = fs.existsSync(WAV);
const log = (...m) => console.log(new Date().toTimeString().slice(0, 8), ...m);

const { page, kapat, W, H } = await ac(`proje=${PROJE}&parca=${PARCA}`);
const { sure, fps, olay } = await page.evaluate(() => ({ sure: window.VIDEO.sure, fps: window.VIDEO.fps, olay: window.VIDEO.olaylar.length }));
const TOPLAM = Math.round(sure * fps);
const F0 = opt('--from', 0), F1 = Math.min(opt('--to', TOPLAM), TOPLAM);
log(`${PROJE}/${PARCA}: ${W}×${H}, ${sure} s, ${TOPLAM} frames, ${olay} events; render ${F0}–${F1}, sub ${SUB}, crf ${CRF}, scale ${OLCEK}${SESLI ? '' : ', SILENT (no cikti/' + PARCA + '.wav)'}`);

const SHUTTER = 0.5;
const vf = [SUB > 1 ? `tmix=frames=${SUB}` : null, SUB > 1 ? `select='eq(mod(n\\,${SUB})\\,${SUB - 1})'` : null, `setpts=N/(${fps}*TB)`,
  OLCEK !== 1 ? `scale=${Math.round(W * OLCEK)}:${Math.round(H * OLCEK)}:flags=bicubic` : null,
  'scale=out_color_matrix=bt709:out_range=tv', 'format=yuv420p'].filter(Boolean).join(',');
const sesGirdi = SESLI ? ['-ss', String(F0 / fps), '-i', WAV] : ['-f', 'lavfi', '-t', String((F1 - F0) / fps), '-i', 'anullsrc=r=48000:cl=stereo'];
const ff = spawn(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'warning',
  '-f', 'image2pipe', '-framerate', String(fps * SUB), '-c:v', 'png', '-i', '-', ...sesGirdi,
  '-filter_complex', `[0:v]${vf}[v]`, '-map', '[v]', '-map', '1:a',
  '-r', String(fps), '-c:v', 'libx264', '-preset', 'medium', '-crf', String(CRF), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', TMP], { stdio: ['pipe', 'inherit', 'pipe'] });
let ffErr = ''; ff.stderr.on('data', (d) => { ffErr += d; if (ffErr.length > 20000) ffErr = ffErr.slice(-10000); });

await page.evaluate((t) => window.VIDEO.render(t), F0 / fps); await page.screenshot({ type: 'png' });   // warm-up
const t0 = Date.now();
for (let f = F0; f < F1; f++) {
  for (let s = 0; s < SUB; s++) {
    const t = f / fps + (s / SUB) * (SHUTTER / fps);
    await page.evaluate((t) => window.VIDEO.render(t), t);
    const buf = await page.screenshot({ type: 'png', optimizeForSpeed: true });
    if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
  }
  const n = f + 1 - F0;
  if (n % 300 === 0) { const el = (Date.now() - t0) / 1000; log(`frame ${f + 1}/${F1} · ${el.toFixed(0)} s · ${(n / el).toFixed(1)} fps · remaining ~${((F1 - f - 1) * el / n).toFixed(0)} s`); }
}
ff.stdin.end();
const [code] = await once(ff, 'close');
await kapat();
if (code !== 0) { console.error(ffErr.slice(-3000)); process.exit(1); }
fs.renameSync(TMP, OUT);
const sn = (Date.now() - t0) / 1000;
const kayit = { proje: PROJE, parca: PARCA, dosya: path.basename(OUT), boyut: `${W}x${H}`, sesli: SESLI, kare: F1 - F0, video_sn: +((F1 - F0) / fps).toFixed(2), render_sn: +sn.toFixed(1),
  kare_sn: +((F1 - F0) / sn).toFixed(2), sub: SUB, crf: CRF, olcek: OLCEK, mb: +(fs.statSync(OUT).size / 1048576).toFixed(1), t: new Date().toISOString() };
fs.writeFileSync(OUT.replace(/\.mp4$/, '.render.json'), JSON.stringify(kayit, null, 1));
log(`done → ${OUT} (${kayit.mb} MB) · ${sn.toFixed(0)} s · ${kayit.kare_sn} fps`);
