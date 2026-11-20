// Shorts sound-effect kit. Rule: we CANNOT HEAR the audio → a small fixed kit;
// the user picks/approves by ear once, then only the approved files are used at a fixed level. No effects are added off the cuff.
// Source: short tonal sounds from ffmpeg synthesis (aevalsrc, no credits); whoosh and paper/envelope textures from the ElevenLabs sound effect API (/v1/sound-generation).
// No licensed library. Level: short sounds peak −20 dBFS; whoosh and envelope −26 LUFS (below the speech at −14 LUFS).
//   node ses/efekt/kur.mjs sentez      (synthesis candidates under ham/)
//   node ses/efekt/kur.mjs eleven [--yes]   (paid: without --yes only a plan and cost note; ElevenLabs candidates under ham/, existing files skipped)
//   node ses/efekt/kur.mjs duzey       (candidates → levelled wav under aday/ + olcum.json)
//   node ses/efekt/kur.mjs dinleme     (kit-dinleme.mp3: 1 s of silence before each candidate, in order; KIT.md time list)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { abonelik, harcamaYaz } from '../eleven.mjs';
import '../../ayar.mjs';   // loads .env into process.env

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..', '..');
import ffmpegYolu from 'ffmpeg-static';
const FF = ffmpegYolu;
const HAM = path.join(DIR, 'ham'), ADAY = path.join(DIR, 'aday');
fs.mkdirSync(HAM, { recursive: true }); fs.mkdirSync(ADAY, { recursive: true });
const ff = (a) => { const r = spawnSync(FF, ['-hide_banner', '-y', ...a], { encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr.slice(-1500)); return r.stderr; };

// ---- synthesis candidates: [name, duration, expression (t in s), extra filter] — both channels the same ----
const SENTEZ = [
  ['tik', 0.06, '0.55*sin(2*PI*1800*t)*exp(-t*90)+0.25*(random(0)*2-1)*exp(-t*260)', '', 'cursor/button click · the SAME formula as the click on the support card'],
  ['sayac-A', 0.035, '0.6*sin(2*PI*3200*t)*exp(-t*180)+0.12*(random(0)*2-1)*exp(-t*600)', '', 'tick while a number counts (thin, metallic)'],
  ['sayac-B', 0.05, '0.5*sin(2*PI*1100*t)*exp(-t*120)+0.3*sin(2*PI*2300*t)*exp(-t*200)', '', 'tick while a number counts (wooden, soft)'],
  ['pop-A', 0.12, '(1-exp(-t*600))*0.7*sin(2*PI*(500*t+7500*t*t))*exp(-t*45)', '', 'element appearing (short pop gliding upward)'],
  ['pop-B', 0.14, '(1-exp(-t*600))*0.7*sin(2*PI*(300*t+5000*t*t))*exp(-t*35)', '', 'element appearing (lower pop)'],
  ['ding-A', 0.8, '(1-exp(-t*400))*(0.6*sin(2*PI*1318.5*t)*exp(-t*5)+0.25*sin(2*PI*2637*t)*exp(-t*8)+0.1*sin(2*PI*3955.5*t)*exp(-t*12))', '', 'correct result/confirmation (single tone, bell)'],
  ['ding-B', 0.8, '(1-exp(-t*400))*0.5*sin(2*PI*1046.5*t)*exp(-t*6)+gte(t,0.09)*(1-exp(-(t-0.09)*400))*0.5*sin(2*PI*1568*t)*exp(-(t-0.09)*6)', '', 'correct result/confirmation (two notes, rising)'],
  ['thud-A', 0.35, '(1-exp(-t*300))*0.9*sin(2*PI*(70*t-50*t*t))*exp(-t*12)+0.25*(random(0)*2-1)*exp(-t*80)', 'lowpass=f=900', 'emphasis (low, soft thump)'],
  ['thud-B', 0.30, '(1-exp(-t*300))*0.9*sin(2*PI*55*t)*exp(-t*15)+0.2*sin(2*PI*1200*t)*exp(-t*220)', 'lowpass=f=1500', 'emphasis (low + a small click)'],
  ['buzz-A', 0.35, '(1-exp(-t*200))*exp(-t*4)*(1-gte(t,0.3)*(t-0.3)*20)*(0.4*(sin(2*PI*146*t)+sin(3*2*PI*146*t)/3+sin(5*2*PI*146*t)/5)+0.3*sin(2*PI*150*t))', 'lowpass=f=1800', 'wrong result (soft buzz)'],
  ['buzz-B', 0.30, 'lt(t,0.12)*(1-exp(-t*300))*exp(-t*10)*0.6*(sin(2*PI*220*t)+sin(3*2*PI*220*t)/4)+gte(t,0.15)*(1-exp(-(t-0.15)*300))*exp(-(t-0.15)*10)*0.6*(sin(2*PI*165*t)+sin(3*2*PI*165*t)/4)', 'lowpass=f=2000', 'wrong result (two short falling notes)'],
  ['whoosh-S', 0.6, '0', '', 'card/scene transition (synthesis fallback: filtered pink noise)'],
];
// ---- ElevenLabs candidates ----
const ELEVEN = [
  ['whoosh-A', 0.7, 'soft subtle swoosh transition, short, clean modern interface sound, no reverb tail', 'card/scene transition'],
  ['whoosh-B', 0.6, 'gentle air whoosh for a slide transition, minimal, smooth, quiet', 'card/scene transition'],
  ['zarf-A', 0.8, 'a single paper envelope sliding quickly across a wooden desk, short, close microphone', 'envelope/mail (S9 style)'],
  ['zarf-B', 0.7, 'paper letter slipped into an envelope, quick soft paper rustle, short', 'envelope/mail (S9 style)'],
];
export const ADAYLAR = [...SENTEZ.map(([ad, , , , ne]) => ({ ad, ne, kaynak: 'ffmpeg synthesis' })), ...ELEVEN.map(([ad, , , ne]) => ({ ad, ne, kaynak: 'ElevenLabs sound effect' }))];

const kip = process.argv[2];
if (kip === 'sentez') {
  for (const [ad, d, ifade, suz] of SENTEZ) {
    const f = path.join(HAM, `${ad}.wav`);
    if (ad === 'whoosh-S') {   // pink noise, sin² envelope, a two-band mix instead of sliding from low-pass to high-pass
      ff(['-f', 'lavfi', '-i', `anoisesrc=c=pink:r=48000:a=0.5:d=${d}:s=7`, '-af', `bandpass=f=900:w=1.2,aeval='val(0)*pow(sin(PI*t/${d}),2)|val(0)*pow(sin(PI*t/${d}),2)':c=stereo`, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', f]);
      continue;
    }
    ff(['-f', 'lavfi', '-i', `aevalsrc='${ifade}|${ifade}':s=48000:d=${d}`, ...(suz ? ['-af', suz] : []), '-c:a', 'pcm_s16le', f]);
  }
  console.log(SENTEZ.length, 'synthesis candidates →', HAM);
} else if (kip === 'eleven') {
  // Paid path: without --yes only the plan and a cost estimate are shown; nothing is sent.
  const yeni = ELEVEN.filter(([ad]) => !fs.existsSync(path.join(HAM, `${ad}.mp3`)));
  console.log(`ElevenLabs sound generation: ${yeni.length} request(s), ${yeni.reduce((a, [, d]) => a + d, 0).toFixed(1)} s of audio in total (existing files are skipped).`);
  for (const [ad, d, metin] of yeni) console.log(`  ${ad}: ${d} s · "${metin}"`);
  console.log('Cost: billed by ElevenLabs per generated second of sound effects; check the current rate for your plan on elevenlabs.io/pricing before running.');
  if (!process.argv.includes('--yes')) { console.log('Estimate only. Run again with --yes to generate.'); process.exit(0); }
  const KEY = (process.env.ELEVENLABS_API_KEY || '').trim(); if (!KEY) throw new Error('ELEVENLABS_API_KEY missing (.env)');
  const a0 = await abonelik(); console.log('remaining before', a0.kalan);
  for (const [ad, d, metin] of ELEVEN) {
    const f = path.join(HAM, `${ad}.mp3`);
    if (fs.existsSync(f)) { console.log(ad, 'exists, not generated'); continue; }
    const r = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: metin, duration_seconds: d, prompt_influence: 0.6 }) });
    if (!r.ok) { const t = await r.text(); throw new Error(`${ad}: ${r.status} ${t.slice(0, 200)}`); }
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    harcamaYaz({ is: `efekt-${ad}`, model: 'sound-generation', karakter: metin.length, sure_sn: d, kredi_olculen: null, dosya: path.relative(ROOT, f).split(path.sep).join('/'), not: 'Shorts efekt kiti adayı' });
    console.log(ad, 'generated');
  }
  await new Promise((r) => setTimeout(r, 4000));
  const a1 = await abonelik(); console.log('remaining after', a1.kalan, '· difference', a0.kalan - a1.kalan);
} else if (kip === 'duzey') {
  const olc = {};
  for (const { ad } of ADAYLAR) {
    const kay = fs.existsSync(path.join(HAM, `${ad}.wav`)) ? path.join(HAM, `${ad}.wav`) : path.join(HAM, `${ad}.mp3`);
    if (!fs.existsSync(kay)) { console.log('missing:', ad); continue; }
    const uzun = /^(whoosh|zarf)/.test(ad);
    // trim silence at the start/end (ElevenLabs), 5 ms fade-in and 30 ms fade-out
    const kirp = path.join(ADAY, `${ad}.kirp.wav`);
    ff(['-i', kay, '-af', 'silenceremove=start_periods=1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,afade=t=in:d=0.005,areverse,afade=t=in:d=0.03,areverse', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', kirp]);
    // long texture (whoosh, envelope): −26 LUFS, but peak at most −16 dBFS; if LUFS cannot be measured (< 0.4 s) use the short-sound rule: peak −20 dBFS
    let kaz;
    const e0 = ff(['-i', kirp, '-af', 'volumedetect,ebur128', '-f', 'null', '-']);
    const mx = +e0.match(/max_volume:\s+(-?[\d.]+) dB/)[1];
    const I0 = +(e0.slice(e0.lastIndexOf('Summary:')).match(/I:\s+(-?[\d.]+) LUFS/) || [])[1];
    const lufsli = uzun && Number.isFinite(I0) && I0 > -70;
    if (lufsli) { kaz = -26 - I0; if (mx + kaz > -16) kaz = -16 - mx; } else kaz = -20 - mx;
    const son = path.join(ADAY, `${ad}.wav`);
    ff(['-i', kirp, '-af', `volume=${kaz.toFixed(2)}dB`, '-c:a', 'pcm_s16le', son]); fs.unlinkSync(kirp);
    const e2 = ff(['-i', son, '-af', 'volumedetect,ebur128=peak=true', '-f', 'null', '-']);
    const sure = (fs.statSync(son).size - 44) / (48000 * 2 * 2);   // 48 kHz, 2 kanal, 16 bit
    const tepe = +e2.match(/max_volume:\s+(-?[\d.]+) dB/)[1];
    const I = +(e2.slice(e2.lastIndexOf('Summary:')).match(/I:\s+(-?[\d.]+) LUFS/) || [])[1];
    olc[ad] = { sure_sn: +sure.toFixed(3), tepe_dbfs: tepe, lufs: Number.isFinite(I) && I > -70 ? I : null, hedef: lufsli ? '−26 LUFS (peak ≤ −16 dBFS)' : 'peak −20 dBFS' };
    console.log(ad.padEnd(9), olc[ad]);
  }
  fs.writeFileSync(path.join(DIR, 'olcum.json'), JSON.stringify(olc, null, 1));
} else if (kip === 'dinleme') {
  // 1 s of silence before each candidate; order as in ADAYLAR; the time list goes to kit-dinleme.zaman.json
  const girdiler = [], fc = [], zamanlar = []; let t = 0, i = 0;
  for (const { ad } of ADAYLAR) {
    const f = path.join(ADAY, `${ad}.wav`); if (!fs.existsSync(f)) continue;
    const sure = (fs.statSync(f).size - 44) / (48000 * 2 * 2);
    t += 1.0; zamanlar.push({ ad, bas: +t.toFixed(2) }); girdiler.push('-i', f);
    fc.push(`[${i}:a]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[a${i}]`); t += sure; i++;
  }
  const toplam = t + 1.0;
  const filtre = fc.join(';') + ';' + zamanlar.map((_, j) => `[a${j}]`).join('') + `amix=inputs=${zamanlar.length}:normalize=0,apad=whole_dur=${toplam}[o]`;
  ff([...girdiler, '-filter_complex', filtre, '-map', '[o]', '-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k', path.join(DIR, 'kit-dinleme.mp3')]);
  fs.writeFileSync(path.join(DIR, 'kit-dinleme.zaman.json'), JSON.stringify(zamanlar, null, 1));
  console.log('kit-dinleme.mp3', toplam.toFixed(1), 's'); zamanlar.forEach((z) => console.log(' ', z.bas.toFixed(2).padStart(6), z.ad));
}
