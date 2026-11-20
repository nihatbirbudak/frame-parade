// Engine: a small static server + headless Chrome. Format: yatay/landscape (1920×1080) or dikey/portrait (1080×1920).
// The root is the repo root; the page is motor/sayfa/sahne.html, project files are in <projeler>/<project>/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import ffmpegYolu from 'ffmpeg-static';
import { KOK, PROJELER, chromeYolu } from '../ayar.mjs';

export const MOTOR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = KOK;
export const FFMPEG = ffmpegYolu;
export const BICIM = { yatay: { W: 1920, H: 1080 }, dikey: { W: 1080, H: 1920 } };
// project format: <project>/proje.json › bicim (landscape if missing)
export function projeBicimi(ad) { const f = path.join(PROJELER, ad, 'proje.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).bicim || 'yatay' : 'yatay'; }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };
const CHROME_GUVENSIZ = new Set([1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668, 6669, 6679, 6697, 10080]);

// The repo root is served read-only; .env, client_secret and token files are not served.
export function sunucu() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(ROOT, url === '/' ? 'motor/sayfa/sahne.html' : url);
      if (!file.startsWith(ROOT) || /(^|[\\/])(\.env|client_secret|token)/i.test(file) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    const dinle = () => srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; if (CHROME_GUVENSIZ.has(p)) { srv.close(dinle); return; } resolve({ srv, port: p }); });
    dinle();
  });
}

// query: proje=<name>&parca=<name>
export async function ac(sorgu) {
  const q = new URLSearchParams(sorgu), { W, H } = BICIM[projeBicimi(q.get('proje'))];
  const { srv, port } = await sunucu();
  const browser = await puppeteer.launch({
    executablePath: chromeYolu(), headless: true, protocolTimeout: 0,
    args: [`--window-size=${W},${H}`, '--hide-scrollbars', '--mute-audio', '--force-color-profile=srgb', '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--font-render-hinting=none'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (['error', 'warn'].includes(m.type()) || m.text().startsWith('[video]')) console.log(`[page:${m.type()}]`, m.text()); });
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.goto(`http://127.0.0.1:${port}/motor/sayfa/sahne.html?${sorgu}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.VIDEO && (window.VIDEO.hazir || window.VIDEO.hata), { timeout: 60000 });
  const hata = await page.evaluate(() => window.VIDEO.hata);
  if (hata) { await browser.close(); srv.close(); throw new Error('page: ' + hata); }
  await page.evaluate(async () => { await document.fonts.ready; });
  return { browser, page, W, H, kapat: async () => { await browser.close(); srv.close(); } };
}
