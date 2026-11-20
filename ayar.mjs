// Shared settings reader: kanal.json (the single settings file) + folder paths + Chrome path.
// Node tools read from here; the browser side reads the same file through motor/sayfa/kimlik.js.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KOK = path.dirname(fileURLToPath(import.meta.url));
// Minimal .env loader (no dependency): KEY=value lines, # comments, optional quotes. Existing environment variables win.
// Values are never printed.
const ENV = path.join(KOK, '.env');
if (fs.existsSync(ENV)) for (const satir of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
  const m = satir.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/); if (!m || satir.trim().startsWith('#')) continue;
  const v = m[2].replace(/^(['"])(.*)\1$/, '$2'); if (process.env[m[1]] === undefined && v !== '') process.env[m[1]] = v;
}
export const KANAL = JSON.parse(fs.readFileSync(path.join(KOK, 'kanal.json'), 'utf8'));
export const PROJELER = path.resolve(KOK, KANAL.klasorler?.projeler || 'projeler');
export const GECICI = KANAL.klasorler?.gecici ? path.resolve(KOK, KANAL.klasorler.gecici) : path.join(os.tmpdir(), 'video-kiti');
export const proje = (ad) => path.join(PROJELER, ad);

// Chrome / Chromium: kanal.json › chrome, else the CHROME_YOLU environment variable, else well-known locations per operating system
export function chromeYolu() {
  const adaylar = [KANAL.chrome, process.env.CHROME_YOLU,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const y = adaylar.find((a) => fs.existsSync(a));
  if (!y) throw new Error('Chrome not found: put its path in the chrome field of kanal.json or in the CHROME_YOLU environment variable');
  return y;
}
