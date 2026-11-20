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

// Syllable count for the speech-tempo measure (syllables per second), by kanal.dil.
//   tr: one syllable per vowel (Turkish spelling is phonetic).
//   en (and any other language): a simple English estimate: vowel groups (a e i o u y) per word, a silent final "e" is
//   dropped (but "-le" after a consonant counts, as in "table"), at least one per word. Rough, but stable for tempo control.
export function heceSay(metin, dil = KANAL.dil || 'en') {
  if (dil === 'tr') return (metin.toLocaleLowerCase('tr').match(/[aeıioöuüâîû]/g) || []).length;
  return (metin.toLowerCase().match(/[a-z']+/g) || []).reduce((n, kelime) => {
    const w = kelime.replace(/'/g, ''); let g = (w.match(/[aeiouy]+/g) || []).length;
    if (g > 1 && /[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w)) g--;
    return n + Math.max(1, g);
  }, 0);
}

// Click words: which spoken word each on-screen button click is locked to (support card, subscribe closing).
// Default by kanal.dil; kanal.json › ses.tik_kelimeleri overrides per button, e.g. { "abone": ["subscribe", "abone"], "begen": ["like"] }.
// Each entry is a word prefix; the first spoken word starting with any prefix gets the click.
const TIK = {
  en: { abone: ['subscrib'], begen: ['like', 'liking'], zil: ['bell', 'notification'] },
  tr: { abone: ['abone'], begen: ['beğen'], zil: ['zil', 'bildirim'] },
};
export const tikKelimeleri = (dil = KANAL.dil || 'en') => ({ ...(TIK[dil] || TIK.en), ...(KANAL.ses?.tik_kelimeleri || {}) });
export function tikBul(kelimeler, tur, dil = KANAL.dil || 'en') {
  const onekler = (tikKelimeleri(dil)[tur] || []).map((o) => o.toLocaleLowerCase(dil));
  return kelimeler.find((w) => { const k = w.w.toLocaleLowerCase(dil).replace(/^[^\p{L}]+/u, ''); return onekler.some((o) => k.startsWith(o)); });
}
