// Shorts ses efekti kiti Kural: biz sesi DUYAMIYORUZ → küçük sabit kit,
// Kullanıcı bir kez kulakla seçer/onaylar, sonra yalnız onaylı dosyalar sabit düzeyde kullanılır. Kafadan efekt eklenmez.
// Kaynak: tonlu kısa sesler ffmpeg sentezi (aevalsrc, kredi yok); whoosh ve kâğıt/zarf dokusu ElevenLabs ses efekti (/v1/sound-generation).
// Telifli kütüphane yok. Düzey: kısa sesler tepe −20 dBFS; whoosh ve zarf −26 LUFS (konuşma −14 LUFS'un altında).
//   node ses/efekt/kur.mjs sentez      (ham/ altına sentez adayları)
//   node ses/efekt/kur.mjs eleven      (ham/ altına ElevenLabs adayları; dosya varsa üretmez)
//   node ses/efekt/kur.mjs duzey       (adaylar → aday/ altında düzeyli wav + olcum.json)
//   node ses/efekt/kur.mjs dinleme     (kit-dinleme.mp3: her adayın önünde 1 sn sessizlik, sırayla; KIT.md zaman listesi)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { abonelik, harcamaYaz } from '../eleven.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..', '..');
import ffmpegYolu from 'ffmpeg-static';
const FF = ffmpegYolu;
const HAM = path.join(DIR, 'ham'), ADAY = path.join(DIR, 'aday');
fs.mkdirSync(HAM, { recursive: true }); fs.mkdirSync(ADAY, { recursive: true });
const ff = (a) => { const r = spawnSync(FF, ['-hide_banner', '-y', ...a], { encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr.slice(-1500)); return r.stderr; };

// ---- sentez adayları: [ad, süre, ifade (t sn), ek süzgeç] — iki kanal aynı ----
const SENTEZ = [
  ['tik', 0.06, '0.55*sin(2*PI*1800*t)*exp(-t*90)+0.25*(random(0)*2-1)*exp(-t*260)', '', 'imleç/düğme tıklaması · destek kartındaki tık ile AYNI formül'],
  ['sayac-A', 0.035, '0.6*sin(2*PI*3200*t)*exp(-t*180)+0.12*(random(0)*2-1)*exp(-t*600)', '', 'sayı dönerken tick (ince, metalik)'],
  ['sayac-B', 0.05, '0.5*sin(2*PI*1100*t)*exp(-t*120)+0.3*sin(2*PI*2300*t)*exp(-t*200)', '', 'sayı dönerken tick (tahta, yumuşak)'],
  ['pop-A', 0.12, '(1-exp(-t*600))*0.7*sin(2*PI*(500*t+7500*t*t))*exp(-t*45)', '', 'öğe belirmesi (yukarı süzülen kısa pop)'],
  ['pop-B', 0.14, '(1-exp(-t*600))*0.7*sin(2*PI*(300*t+5000*t*t))*exp(-t*35)', '', 'öğe belirmesi (daha alçak pop)'],
  ['ding-A', 0.8, '(1-exp(-t*400))*(0.6*sin(2*PI*1318.5*t)*exp(-t*5)+0.25*sin(2*PI*2637*t)*exp(-t*8)+0.1*sin(2*PI*3955.5*t)*exp(-t*12))', '', 'doğru sonuç/onay (tek ton, çan)'],
  ['ding-B', 0.8, '(1-exp(-t*400))*0.5*sin(2*PI*1046.5*t)*exp(-t*6)+gte(t,0.09)*(1-exp(-(t-0.09)*400))*0.5*sin(2*PI*1568*t)*exp(-(t-0.09)*6)', '', 'doğru sonuç/onay (iki nota, yükselen)'],
  ['thud-A', 0.35, '(1-exp(-t*300))*0.9*sin(2*PI*(70*t-50*t*t))*exp(-t*12)+0.25*(random(0)*2-1)*exp(-t*80)', 'lowpass=f=900', 'vurgu (alçak, yumuşak darbe)'],
  ['thud-B', 0.30, '(1-exp(-t*300))*0.9*sin(2*PI*55*t)*exp(-t*15)+0.2*sin(2*PI*1200*t)*exp(-t*220)', 'lowpass=f=1500', 'vurgu (alçak + küçük çıt)'],
  ['buzz-A', 0.35, '(1-exp(-t*200))*exp(-t*4)*(1-gte(t,0.3)*(t-0.3)*20)*(0.4*(sin(2*PI*146*t)+sin(3*2*PI*146*t)/3+sin(5*2*PI*146*t)/5)+0.3*sin(2*PI*150*t))', 'lowpass=f=1800', 'yanlış sonuç (yumuşak vızıltı)'],
  ['buzz-B', 0.30, 'lt(t,0.12)*(1-exp(-t*300))*exp(-t*10)*0.6*(sin(2*PI*220*t)+sin(3*2*PI*220*t)/4)+gte(t,0.15)*(1-exp(-(t-0.15)*300))*exp(-(t-0.15)*10)*0.6*(sin(2*PI*165*t)+sin(3*2*PI*165*t)/4)', 'lowpass=f=2000', 'yanlış sonuç (inen iki kısa nota)'],
  ['whoosh-S', 0.6, '0', '', 'kart/sahne geçişi (sentez yedeği: süzülmüş pembe gürültü)'],
];
// ---- ElevenLabs adayları ----
const ELEVEN = [
  ['whoosh-A', 0.7, 'soft subtle swoosh transition, short, clean modern interface sound, no reverb tail', 'kart/sahne geçişi'],
  ['whoosh-B', 0.6, 'gentle air whoosh for a slide transition, minimal, smooth, quiet', 'kart/sahne geçişi'],
  ['zarf-A', 0.8, 'a single paper envelope sliding quickly across a wooden desk, short, close microphone', 'zarf/posta (S9 tarzı)'],
  ['zarf-B', 0.7, 'paper letter slipped into an envelope, quick soft paper rustle, short', 'zarf/posta (S9 tarzı)'],
];
export const ADAYLAR = [...SENTEZ.map(([ad, , , , ne]) => ({ ad, ne, kaynak: 'ffmpeg sentezi' })), ...ELEVEN.map(([ad, , , ne]) => ({ ad, ne, kaynak: 'ElevenLabs ses efekti' }))];

const kip = process.argv[2];
if (kip === 'sentez') {
  for (const [ad, d, ifade, suz] of SENTEZ) {
    const f = path.join(HAM, `${ad}.wav`);
    if (ad === 'whoosh-S') {   // pembe gürültü, sin² zarf, alçak geçirgenden yüksek geçirgene kayış yerine iki bant karışımı
      ff(['-f', 'lavfi', '-i', `anoisesrc=c=pink:r=48000:a=0.5:d=${d}:s=7`, '-af', `bandpass=f=900:w=1.2,aeval='val(0)*pow(sin(PI*t/${d}),2)|val(0)*pow(sin(PI*t/${d}),2)':c=stereo`, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', f]);
      continue;
    }
    ff(['-f', 'lavfi', '-i', `aevalsrc='${ifade}|${ifade}':s=48000:d=${d}`, ...(suz ? ['-af', suz] : []), '-c:a', 'pcm_s16le', f]);
  }
  console.log(SENTEZ.length, 'sentez adayı →', HAM);
} else if (kip === 'eleven') {
  const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).map((l) => /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]));
  const KEY = (env.ELEVENLABS_API_KEY || '').trim(); if (!KEY) throw new Error('ELEVENLABS_API_KEY yok');
  const a0 = await abonelik(); console.log('kalan önce', a0.kalan);
  for (const [ad, d, metin] of ELEVEN) {
    const f = path.join(HAM, `${ad}.mp3`);
    if (fs.existsSync(f)) { console.log(ad, 'var, üretilmedi'); continue; }
    const r = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: metin, duration_seconds: d, prompt_influence: 0.6 }) });
    if (!r.ok) { const t = await r.text(); throw new Error(`${ad}: ${r.status} ${t.slice(0, 200)}`); }
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    harcamaYaz({ is: `efekt-${ad}`, model: 'sound-generation', karakter: metin.length, sure_sn: d, kredi_olculen: null, dosya: path.relative(ROOT, f).split(path.sep).join('/'), not: 'Shorts efekt kiti adayı' });
    console.log(ad, 'üretildi');
  }
  await new Promise((r) => setTimeout(r, 4000));
  const a1 = await abonelik(); console.log('kalan sonra', a1.kalan, '· fark', a0.kalan - a1.kalan);
} else if (kip === 'duzey') {
  const olc = {};
  for (const { ad } of ADAYLAR) {
    const kay = fs.existsSync(path.join(HAM, `${ad}.wav`)) ? path.join(HAM, `${ad}.wav`) : path.join(HAM, `${ad}.mp3`);
    if (!fs.existsSync(kay)) { console.log('yok:', ad); continue; }
    const uzun = /^(whoosh|zarf)/.test(ad);
    // başta/sonda sessizlik kırp (ElevenLabs), 10 ms giriş ve 30 ms çıkış sönümü
    const kirp = path.join(ADAY, `${ad}.kirp.wav`);
    ff(['-i', kay, '-af', 'silenceremove=start_periods=1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,afade=t=in:d=0.005,areverse,afade=t=in:d=0.03,areverse', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', kirp]);
    // uzun doku (whoosh, zarf): −26 LUFS, ama tepe en çok −16 dBFS; LUFS ölçülemezse (< 0,4 sn) kısa ses kuralı: tepe −20 dBFS
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
    olc[ad] = { sure_sn: +sure.toFixed(3), tepe_dbfs: tepe, lufs: Number.isFinite(I) && I > -70 ? I : null, hedef: lufsli ? '−26 LUFS (tepe ≤ −16 dBFS)' : 'tepe −20 dBFS' };
    console.log(ad.padEnd(9), olc[ad]);
  }
  fs.writeFileSync(path.join(DIR, 'olcum.json'), JSON.stringify(olc, null, 1));
} else if (kip === 'dinleme') {
  // her adayın önünde 1 sn sessizlik; sıra ADAYLAR'daki gibi; zaman listesi zamanlar.json'a
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
  console.log('kit-dinleme.mp3', toplam.toFixed(1), 'sn'); zamanlar.forEach((z) => console.log(' ', z.bas.toFixed(2).padStart(6), z.ad));
}
