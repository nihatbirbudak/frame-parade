// Adds an English title/description (localizations.en) and EN subtitles to an already uploaded video.
// Usage: node youtube/en-ekle.mjs <package folder> <videoId> [--yes]   (a dry run without --yes)
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { api, erisimJetonu, KOK } from './api.mjs';

const [klasorArg, videoId] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const GERCEK = process.argv.includes('--yes');
const k = resolve(KOK, klasorArg);
const paket = existsSync(join(k, 'paket')) ? join(k, 'paket') : k;
const oku = (ad) => existsSync(join(paket, ad)) ? readFileSync(join(paket, ad), 'utf8').replace(/^﻿/, '').trim() : null;
const baslikEn = oku('baslik-en.txt'), aciklamaEn = oku('aciklama-en.txt');
const srtEn = existsSync(join(paket, 'altyazi-en.srt')) ? join(paket, 'altyazi-en.srt') : null;

const v = (await api(`https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations&id=${videoId}`)).items?.[0];
if (!v) { console.log('Video not found:', videoId); process.exit(1); }
const mevcut = await api(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}`);
const enAltyaziVar = (mevcut.items || []).some(c => c.snippet.language === 'en');
console.log(`${GERCEK ? 'REAL' : 'DRY RUN'} · ${videoId} · ${v.snippet.title}`);
console.log(`  EN title: ${baslikEn || '—'} (currently: ${v.localizations?.en?.title || 'none'})`);
console.log(`  EN description: ${aciklamaEn ? aciklamaEn.length + ' characters' : '—'} · EN subtitles: ${srtEn ? (enAltyaziVar ? 'already there, skipped' : 'will be added') : 'no file'}`);
if (!GERCEK) process.exit(0);

if (baslikEn || aciklamaEn) {
  const s = v.snippet;
  await api('https://www.googleapis.com/youtube/v3/videos?part=snippet,localizations', {
    method: 'PUT', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: videoId,
      snippet: { title: s.title, description: s.description, tags: s.tags, categoryId: s.categoryId, defaultLanguage: s.defaultLanguage || 'tr', defaultAudioLanguage: s.defaultAudioLanguage || 'tr' },
      localizations: { ...(v.localizations || {}), en: { title: baslikEn || s.title, description: aciklamaEn || s.description } },
    }),
  });
  console.log('  ✓ EN title and description');
}
if (srtEn && !enAltyaziVar) {
  const sinir = 'kit' + Date.now();
  const govde = Buffer.concat([
    Buffer.from(`--${sinir}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ snippet: { videoId, language: 'en', name: '', isDraft: false } })}\r\n--${sinir}\r\nContent-Type: application/octet-stream\r\n\r\n`),
    readFileSync(srtEn), Buffer.from(`\r\n--${sinir}--`),
  ]);
  const r = await fetch('https://www.googleapis.com/upload/youtube/v3/captions?part=snippet&uploadType=multipart', {
    method: 'POST', headers: { authorization: `Bearer ${await erisimJetonu()}`, 'content-type': `multipart/related; boundary=${sinir}` }, body: govde,
  });
  console.log(r.ok ? '  ✓ EN subtitles' : `  ERROR EN subtitles ${r.status}: ${(await r.text()).slice(0, 200)}`);
}
