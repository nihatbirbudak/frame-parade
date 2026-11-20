// Ortak ayar okuyucu: kanal.json (tek ayar dosyası) + klasör yolları + Chrome yolu.
// Node araçları buradan okur; tarayıcı tarafı motor/sayfa/kimlik.js ile aynı dosyayı okur.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KOK = path.dirname(fileURLToPath(import.meta.url));
export const KANAL = JSON.parse(fs.readFileSync(path.join(KOK, 'kanal.json'), 'utf8'));
export const PROJELER = path.resolve(KOK, KANAL.klasorler?.projeler || 'projeler');
export const GECICI = KANAL.klasorler?.gecici ? path.resolve(KOK, KANAL.klasorler.gecici) : path.join(os.tmpdir(), 'video-kiti');
export const proje = (ad) => path.join(PROJELER, ad);

// Chrome / Chromium: kanal.json › chrome, yoksa CHROME_YOLU ortam değişkeni, yoksa işletim sistemine göre bilinen yerler
export function chromeYolu() {
  const adaylar = [KANAL.chrome, process.env.CHROME_YOLU,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const y = adaylar.find((a) => fs.existsSync(a));
  if (!y) throw new Error('Chrome bulunamadı: kanal.json › chrome alanına ya da CHROME_YOLU ortam değişkenine yolunu yazın');
  return y;
}
