// Secret scan: every text file in the repo (except node_modules, cikti, .git) and every added line in the git history
// (all branches) is searched for key patterns, email, phone, local user paths and the voice-ID format. Personal patterns
// (name, brand, internal record number…) are read from tara.yerel.json, which is not committed (example:
// tara.yerel.ornek.json). The result goes to TARAMA.md (also not committed).
// Findings never show the matched value: only where, the pattern name and a masked preview (first 4 characters + ***).
// Not scanned by design: .env and other ignored secret files (they must never be committed).
// Run it every time before publishing.
//   node tara.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const KOK = path.dirname(fileURLToPath(import.meta.url));
const GENEL = [
  ['key: sk_', /\bsk[_-][A-Za-z0-9]{16,}/], ['key: AIza', /AIza[0-9A-Za-z_-]{20,}/], ['key: gh*_', /\bgh[opsu]_[A-Za-z0-9]{20,}/],
  ['key: xi-api', /xi-api-key\s*[:=]\s*['"][A-Za-z0-9]{10,}/i], ['client_secret value', /client_secret['"]?\s*[:=]\s*['"][A-Za-z0-9_-]{10,}/],
  ['refresh_token value', /refresh_token['"]?\s*[:=]\s*['"]1\/\/[A-Za-z0-9_-]{10,}/], ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['voice ID format', /['"](?=[A-Za-z0-9]{20}['"])(?=[^'"]*\d)(?=[^'"]*[A-Z])(?=[^'"]*[a-z])[A-Za-z0-9]{20}['"]/],
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/], ['phone', /\+\d{1,3}[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/],
  ['local path', /[A-Za-z]:\\\\?Users\\\\?[^\\\s'"]+|\/home\/[^/\s'"]+\/|\/Users\/[^/\s'"]+\//],
];
// tara.yerel.json: { "desenler": [["name", "regular expression", "flags"]], "izinli": { "file": ["pattern name", …] } }
const YEREL_F = path.join(KOK, 'tara.yerel.json');
const YEREL = fs.existsSync(YEREL_F) ? JSON.parse(fs.readFileSync(YEREL_F, 'utf8')) : { desenler: [], izinli: {} };
const DESEN = [...GENEL, ...(YEREL.desenler || []).map(([ad, re, b = 'i']) => [ad, new RegExp(re, b)])];
const ATLA = new Set(['tara.mjs', 'TARAMA.md', 'tara.yerel.json']);
const maske = (re, satir) => { const m = satir.match(re); return m ? m[0].slice(0, 4) + '***' : '***'; };
const bulgular = [];
const tara = (yer, satir, rel) => { for (const [ad, re] of DESEN) if (re.test(satir) && !(YEREL.izinli?.[rel] || []).includes(ad)) bulgular.push({ yer, ad, onizleme: maske(re, satir) }); };

// working tree
const gez = (d) => {
  for (const g of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', 'cikti', '.git'].includes(g.name)) continue;
    const f = path.join(d, g.name);
    if (g.isDirectory()) { gez(f); continue; }
    const rel = path.relative(KOK, f).split(path.sep).join('/');
    if (ATLA.has(rel) || !/\.(m?js|json|md|css|html|txt|srt|ornek)$|^(\.gitignore|LICENSE)$/.test(g.name)) continue;
    fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((satir, i) => tara(`${rel}:${i + 1}`, satir, rel));
  }
};
gez(KOK);

// git history: every added line of every commit on every branch
let gitDurum = 'not a git repository, history not scanned';
if (fs.existsSync(path.join(KOK, '.git'))) {
  const r = spawnSync('git', ['log', '-p', '--all', '--no-color', '--format=@@commit %h'], { cwd: KOK, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
  if (r.status === 0) {
    let commit = '?', dosya = '?', n = 0;
    for (const satir of r.stdout.split(/\r?\n/)) {
      if (satir.startsWith('@@commit ')) { commit = satir.slice(9); continue; }
      if (satir.startsWith('+++ ')) { dosya = satir.replace(/^\+\+\+ (b\/)?/, ''); continue; }
      if (satir.startsWith('+') && !ATLA.has(dosya)) { n++; tara(`git ${commit} ${dosya}`, satir.slice(1), dosya); }
    }
    gitDurum = `scanned, ${n} added lines across all branches`;
  } else gitDurum = 'git log failed, history not scanned';
}

const md = ['# Secret scan', '', `${new Date().toISOString()} · \`node tara.mjs\``, '',
  `General patterns: ${GENEL.map((d) => d[0]).join(' · ')}. Local patterns: ${(YEREL.desenler || []).length} (tara.yerel.json${fs.existsSync(YEREL_F) ? '' : ' missing'}).`,
  `Scope: working tree except node_modules/, cikti/, .git/ and the scan files; git history: ${gitDurum}. Not scanned by design: .env and other ignored secret files.`,
  'Findings show only where, the pattern and a masked preview (first 4 characters + ***), never the value.', '',
  bulgular.length ? `**${bulgular.length} findings**` : '**No findings.**', '',
  ...(bulgular.length ? ['| Where | Pattern | Preview |', '|---|---|---|', ...bulgular.map((b) => `| ${b.yer} | ${b.ad} | \`${b.onizleme}\` |`)] : [])].join('\n');
fs.writeFileSync(path.join(KOK, 'TARAMA.md'), md + '\n');
console.log(`${bulgular.length ? bulgular.length + ' findings' : 'no findings'} (general ${GENEL.length} + local ${(YEREL.desenler || []).length} patterns; git history: ${gitDurum}) → TARAMA.md`);
for (const b of bulgular) console.log(`  ${b.yer} [${b.ad}] ${b.onizleme}`);
