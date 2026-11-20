// Gizli bilgi taraması: depo içindeki (node_modules, cikti, .git hariç) her metin dosyasında anahtar desenleri, e-posta,
// telefon, yerel kullanıcı yolları ve ses kimliği biçimi aranır. Kişiye özel desenler (ad, marka, iç kayıt numarası…)
// depoya girmeyen tara.yerel.json dosyasından okunur (örnek: tara.yerel.ornek.json). Sonuç TARAMA.md (o da depoya girmez).
// Yayından önce her seferinde koşulur.
//   node tara.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const KOK = path.dirname(fileURLToPath(import.meta.url));
const GENEL = [
  ['anahtar: sk_', /\bsk[_-][A-Za-z0-9]{16,}/], ['anahtar: AIza', /AIza[0-9A-Za-z_-]{20,}/], ['anahtar: gh*_', /\bgh[opsu]_[A-Za-z0-9]{20,}/],
  ['anahtar: xi-api', /xi-api-key\s*[:=]\s*['"][A-Za-z0-9]{10,}/i], ['client_secret değeri', /client_secret['"]?\s*[:=]\s*['"][A-Za-z0-9_-]{10,}/],
  ['refresh_token değeri', /refresh_token['"]?\s*[:=]\s*['"]1\/\/[A-Za-z0-9_-]{10,}/], ['özel anahtar', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['ses kimliği biçimi', /['"](?=[A-Za-z0-9]{20}['"])(?=[^'"]*\d)(?=[^'"]*[A-Z])(?=[^'"]*[a-z])[A-Za-z0-9]{20}['"]/],
  ['e-posta', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/], ['telefon', /\+\d{1,3}[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/],
  ['yerel yol', /[A-Za-z]:\\\\?Users\\\\?[^\\\s'"]+|\/home\/[^/\s'"]+\/|\/Users\/[^/\s'"]+\//],
];
// tara.yerel.json: { "desenler": [["ad", "düzenli ifade", "bayraklar"]], "izinli": { "dosya": ["desen adı", …] } }
const YEREL_F = path.join(KOK, 'tara.yerel.json');
const YEREL = fs.existsSync(YEREL_F) ? JSON.parse(fs.readFileSync(YEREL_F, 'utf8')) : { desenler: [], izinli: {} };
const DESEN = [...GENEL, ...(YEREL.desenler || []).map(([ad, re, b = 'i']) => [ad, new RegExp(re, b)])];
const ATLA = new Set(['tara.mjs', 'TARAMA.md', 'tara.yerel.json']);
const bulgular = [];
const gez = (d) => {
  for (const g of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', 'cikti', '.git'].includes(g.name)) continue;
    const f = path.join(d, g.name);
    if (g.isDirectory()) { gez(f); continue; }
    const rel = path.relative(KOK, f).split(path.sep).join('/');
    if (ATLA.has(rel) || !/\.(m?js|json|md|css|html|txt|srt|ornek)$|^(\.gitignore|LICENSE)$/.test(g.name)) continue;
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((satir, i) => {
      for (const [ad, re] of DESEN) if (re.test(satir) && !(YEREL.izinli?.[rel] || []).includes(ad)) bulgular.push({ rel, n: i + 1, ad, satir: satir.trim().slice(0, 140) });
    });
  }
};
gez(KOK);
const md = ['# Gizli bilgi taraması', '', `${new Date().toISOString()} · \`node tara.mjs\``, '',
  `Genel desenler: ${GENEL.map((d) => d[0]).join(' · ')}. Yerel desen: ${(YEREL.desenler || []).length} (tara.yerel.json${fs.existsSync(YEREL_F) ? '' : ' yok'}).`,
  'Hariç: node_modules/, cikti/, .git/, tarama dosyaları.', '',
  bulgular.length ? `**${bulgular.length} bulgu**` : '**Bulgu yok.**', '',
  ...(bulgular.length ? ['| Dosya | Satır | Desen | İçerik |', '|---|---|---|---|', ...bulgular.map((b) => `| ${b.rel} | ${b.n} | ${b.ad} | \`${b.satir.replace(/\|/g, '\\|').replace(/`/g, "'")}\` |`)] : [])].join('\n');
fs.writeFileSync(path.join(KOK, 'TARAMA.md'), md + '\n');
console.log(`${bulgular.length ? bulgular.length + ' bulgu' : 'bulgu yok'} (genel ${GENEL.length} + yerel ${(YEREL.desenler || []).length} desen) → TARAMA.md`);
for (const b of bulgular) console.log(`  ${b.rel}:${b.n} [${b.ad}] ${b.satir}`);
