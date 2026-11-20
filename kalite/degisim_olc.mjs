// Saniye başına görsel değişim ölçümü : video 1 kare/sn örneklenir, 64×36 gri,
// ardışık iki örnekte 12 seviyeden fazla değişen piksel oranı. "Değişen saniye" = oran > %0,5; "büyük değişim" = > %5.
// Referans (YouTube) tarafı aynı ölçüyle tarayıcıda canvas'tan alındı; kare dosyaya yazılmadı.
//   node motor/degisim_olc.mjs <video.mp4> [baş sn] [son sn]
import { spawnSync } from 'node:child_process';
import { FFMPEG } from '../motor/lib.mjs';

const [VID, A = 0, B = 99999] = process.argv.slice(2);
const r = spawnSync(FFMPEG, ['-v', 'error', '-ss', String(A), '-to', String(B), '-i', VID, '-vf', 'fps=1,scale=64:36:flags=area,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 });
const buf = r.stdout, n = 64 * 36, kare = Math.floor(buf.length / n);
const oran = [];
for (let k = 1; k < kare; k++) { let d = 0; for (let i = 0; i < n; i++) if (Math.abs(buf[k * n + i] - buf[(k - 1) * n + i]) > 12) d++; oran.push(d / n); }
const degisen = oran.filter((o) => o > 0.005).length, buyuk = oran.filter((o) => o > 0.05).length;
console.log(JSON.stringify({ video: VID, aralik: [Number(A), Number(B)], saniye: oran.length, degisen, degisen_oran: +(degisen / oran.length).toFixed(2), buyuk, buyuk_dk: +(buyuk / oran.length * 60).toFixed(1), oranlar: oran.map((o) => +o.toFixed(3)) }));
