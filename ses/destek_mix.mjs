// Destek kartı sesi: seçilen alımı karta hazırlar. Virgülde duraklama açılır (ham alımda 0,04–0,08 sn), tempo atempo ile
// yumuşatılır (VIDEO-KIMLIGI §3: ±%8), düzey −15 LUFS. Kelime zamanları aynı dönüşümle taşınır; tıklama anları kelimelere
// kilitlenir (abone → "Abone", beğen → "beğenirseniz"). Ayrıca hafif "tık" sesi üretir (kısa, kendi sentezimiz).
//   node ses/destek_mix.mjs <proje> A A-11      → <projeler>/<proje>/destek/destek-A.wav + destek-A.json
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './eleven.mjs';
import { GECICI, proje } from '../ayar.mjs';

const [DERS = 'ornek', SURUM = 'A', ALIM = 'A-11'] = process.argv.slice(2);
import ffmpegYolu from 'ffmpeg-static';
const FF = ffmpegYolu;
const DIR = path.join(proje(DERS), 'destek');
const MP3 = path.join(DIR, 'ses', `${ALIM}.mp3`);
const { kelimeler } = JSON.parse(fs.readFileSync(MP3.replace(/\.mp3$/, '.kelimeler.json'), 'utf8'));
const DURAK = 0.22, TEMPO = 0.93, HEDEF = -15;
const vi = kelimeler.findIndex((w) => w.w.endsWith(','));
const kes = +((kelimeler[vi].t1 + kelimeler[vi + 1].t0) / 2).toFixed(3);
const ff = (args) => { const r = spawnSync(FF, ['-hide_banner', '-y', ...args], { encoding: 'utf8' }); if (r.status) throw new Error(r.stderr.slice(-800)); return r.stderr; };
const ham = path.join(DIR, `destek-${SURUM}.ham.wav`), cikti = path.join(DIR, `destek-${SURUM}.wav`);
ff(['-i', MP3, '-filter_complex', `[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit[x][y];[x]atrim=0:${kes},asetpts=PTS-STARTPTS,apad=pad_dur=${DURAK}[a];[y]atrim=${kes},asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1,atempo=${TEMPO}[o]`, '-map', '[o]', '-c:a', 'pcm_s16le', ham]);
const olc = (f) => { const e = ff(['-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-']); return { I: +e.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0], TP: +(e.match(/Peak:\s+(-?[\d.]+)/g) || ['Peak: 0']).pop().match(/-?[\d.]+/)[0] }; };
const m0 = olc(ham), kazanc = Math.min(HEDEF - m0.I, -1.5 - m0.TP);
ff(['-i', ham, '-af', `volume=${kazanc.toFixed(2)}dB`, '-c:a', 'pcm_s16le', cikti]); fs.unlinkSync(ham);
const m1 = olc(cikti);
const tas = (t) => +(((t < kes ? t : t + DURAK)) / TEMPO).toFixed(3);
const kel = kelimeler.map((w) => ({ w: w.w, t0: tas(w.t0), t1: tas(w.t1) }));
const bul = (on) => kel.find((w) => w.w.toLocaleLowerCase('tr').startsWith(on));
const tiklar = [['abone', +(bul('abone').t0 + 0.03).toFixed(3)], ['begen', +(bul('beğen').t0 + 0.03).toFixed(3)]];
const sure = kel[kel.length - 1].t1;
// tık: 1,8 kHz kısa sinüs + çok kısa gürültü, ~60 ms; tepe −20 dBFS
const TIK = path.join(DIR, 'tik.wav');
if (!fs.existsSync(TIK)) ff(['-f', 'lavfi', '-i', "aevalsrc='0.55*sin(2*PI*1800*t)*exp(-t*90)+0.25*(random(0)*2-1)*exp(-t*260)|0.55*sin(2*PI*1800*t)*exp(-t*90)+0.25*(random(1)*2-1)*exp(-t*260)':s=48000:d=0.06", '-af', 'volume=-14dB', '-c:a', 'pcm_s16le', TIK]);
const kayit = { surum: SURUM, alim: ALIM, metin: kelimeler.map((w) => w.w).join(' '), durak_sn: DURAK, tempo: TEMPO, kazanc_db: +kazanc.toFixed(2), lufs: m1.I, tepe: m1.TP,
  sure, hece_sn: +((kelimeler.map((w) => w.w).join(' ').toLocaleLowerCase('tr').match(/[aeıioöuüâîû]/g) || []).length / (sure - kel[0].t0)).toFixed(2), kelimeler: kel, tiklar };
fs.writeFileSync(path.join(DIR, `destek-${SURUM}.json`), JSON.stringify(kayit, null, 1));
console.log(`${SURUM} (${ALIM}): ${sure.toFixed(2)} sn, ${kayit.hece_sn} hece/sn, ${m1.I} LUFS, tepe ${m1.TP}; tıklar ${JSON.stringify(tiklar)}`);
