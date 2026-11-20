// Support card: the pattern viewers know from YouTube (like · subscribe · bell), drawn by us; no logo.
// Suggested use: once in a long video, 4–6 s, at the chapter boundary after the first "I get it" moment (yonetim/VIDEO-KIMLIGI.md).
// Three buttons side by side in the middle of the screen: LIKE (thumb) · red SUBSCRIBE · bell. No logo and no "YouTube" text; the button colour is kanal.json ›
// renkler.abone_dugmesi (default: a red close to YouTube's), the rest is the channel palette. A mouse cursor enters and clicks the three buttons
// in turn; order and times follow the narration sentence (each click is locked to a word; the bell is optional).
//   like       → the thumb fills, bounces a little, an amber "+1" rises and fades
//   subscribe  → the red button is pressed and turns into a grey "SUBSCRIBED"
//   bell       → the bell fills, rings, short vibration lines on both sides
// Entrance: the previous scene slides up and fades, the card comes in softly; exit: the card fades, the next chapter card arrives.
//
//   import { destekKarti, destekGoster, DESTEK_SURE } from '/motor/sayfa/destek.js';
//   const d = destekKarti(sahne, { ders: 4 });
//   destekGoster(tl, d, t0, { tiklar: [['abone', an('dk_abone')], ['begen', an('dk_begen')]], t1, arka: [oncekiKatman] });
//   d.tiklar → click times in order (for the "click" effect in the audio mix)
import * as B from './bilesen.js';
import { KANAL, M, BUYUK } from './kimlik.js';
const { R } = B;
export const DESTEK_SURE = 5.0;
export const KIRMIZI = KANAL.renkler?.abone_dugmesi || '#FF0033', GRI = '#2E3138';
const NS = 'http://www.w3.org/2000/svg';

const BASPARMAK = { manset: 'M10,46 L26,46 L26,92 L10,92 Z', el: 'M34,46 L49,14 C51,9 59,8 61,14 C62,18 61,24 60,30 L58,40 L82,40 C91,40 96,47 94,55 L88,84 C87,89 82,92 77,92 L34,92 Z' };
const ZIL = { govde: 'M50,12 C33,12 25,25 25,42 L25,61 L16,73 L84,73 L75,61 L75,42 C75,25 67,12 50,12 Z', dil: 'M41,79 C42,88 58,88 59,79' };
const IMLEC = 'M0,0 L0,36 L9,27.5 L15.5,42 L22,39 L15.6,25 L27,25 Z';

function dugme(par, { x, y, w, h, bg, cer }) {
  const d = document.createElement('div');
  Object.assign(d.style, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderRadius: h / 2 + 'px', background: bg, border: cer ? `2px solid ${cer}` : 'none' });
  par.appendChild(d); gsap.set(d, { autoAlpha: 0 }); return d;
}
function simge(par, yollar, { x, y, boy, kalin = 7 }) {
  const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('width', boy); s.setAttribute('height', boy);
  Object.assign(s.style, { position: 'absolute', left: x + 'px', top: y + 'px', overflow: 'visible' }); par.appendChild(s);
  const dolgu = yollar.map((d) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', R.metin); s.appendChild(p); gsap.set(p, { autoAlpha: 0 }); return p; });
  const cizgi = yollar.map((d) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); Object.entries({ fill: 'none', stroke: R.metin, 'stroke-width': kalin, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }).forEach(([k, v]) => p.setAttribute(k, v)); s.appendChild(p); return p; });
  return { s, dolgu, cizgi };
}
function etiket(par, txt, { boy = 40, ag = 700, renk = R.metin, sol, orta = false }) {
  const e = document.createElement('div'); e.textContent = txt;
  Object.assign(e.style, { position: 'absolute', top: '50%', whiteSpace: 'nowrap', lineHeight: 1, fontFamily: 'var(--baslik)', fontSize: boy + 'px', fontWeight: ag, color: renk, letterSpacing: '0.01em' });
  if (orta) Object.assign(e.style, { left: '50%', transform: 'translate(-50%, -50%)' }); else Object.assign(e.style, { left: sol + 'px', transform: 'translateY(-50%)' });
  par.appendChild(e); return e;
}

export function destekKarti(par, { ders, seri = KANAL.seri } = {}) {
  const k = B.katman(par, 'destek'); k.style.background = 'var(--zemin)'; gsap.set(k, { autoAlpha: 0 });
  // small tag at the top (channel name + series)
  const kn = B.yazi(k, BUYUK(KANAL.ad), { x: 960, y: 352, boy: 28, ag: 600, sayi: true, ls: 0.1, hiza: 'orta' });
  const ser = B.yazi(k, BUYUK(`${seri} · ${M('episode')} ${ders}`), { x: 960, y: 396, boy: 22, ag: 600, sayi: true, renk: 'ik', ls: 0.08, hiza: 'orta' });
  // three buttons side by side: 280 + 40 + 460 + 56 + 112 = 948 px, centred
  const H = 112, Y = 484, X0 = 960 - 474;
  const bg = dugme(k, { x: X0, y: Y, w: 280, h: H, bg: R.yuzey, cer: R.cizgi });
  const bp = simge(bg, [BASPARMAK.manset, BASPARMAK.el], { x: 40, y: 24, boy: 60 });
  const bgEt = etiket(bg, M('like'), { boy: 38, sol: 122 });
  const art1 = B.yazi(k, '+1', { x: X0 + 70, y: Y - 6, boy: 40, sayi: true, renk: 'vu', hiza: 'orta', dikey: 'alt' });
  const AX = X0 + 320, ab = dugme(k, { x: AX, y: Y, w: 460, h: H, bg: KIRMIZI });
  const abEt = etiket(ab, M('subscribe'), { boy: 42, ag: 800, orta: true });
  const abOk = etiket(ab, M('subscribed'), { boy: 38, ag: 700, renk: R.metin, orta: true }); gsap.set(abOk, { autoAlpha: 0 });
  const ZX = AX + 516, zl = dugme(k, { x: ZX, y: Y, w: H, h: H, bg: R.yuzey, cer: R.cizgi });
  const zs = simge(zl, [ZIL.govde, ZIL.dil], { x: 24, y: 22, boy: 64 });
  // bell vibration lines (page coordinates)
  const sv = B.svgK(k), zc = ZX + H / 2, yc = Y + H / 2;
  const titre = [[-1, 66], [-1, 80], [1, 66], [1, 80]].map(([yon, r]) => B.yol(sv, `M${zc + yon * (r - 6)},${yc - 44} Q${zc + yon * (r + 6)},${yc - 30} ${zc + yon * r},${yc - 10}`, 'c v'));
  // cursor: off-white arrow, thin background-coloured edge; its tip is at (0,0)
  const im = document.createElementNS(NS, 'svg'); im.setAttribute('width', 44); im.setAttribute('height', 66); im.setAttribute('viewBox', '-2 -2 31 46');
  Object.assign(im.style, { position: 'absolute', left: '0px', top: '0px', overflow: 'visible' }); k.appendChild(im);
  const imY = document.createElementNS(NS, 'path'); imY.setAttribute('d', IMLEC); Object.entries({ fill: R.metin, stroke: R.zemin, 'stroke-width': 2, 'stroke-linejoin': 'round' }).forEach(([a, v]) => imY.setAttribute(a, v)); im.appendChild(imY);
  gsap.set(im, { autoAlpha: 0, x: 1560, y: 900, transformOrigin: '0% 0%' });
  return { k, kn, ser, bg, bp, bgEt, art1, ab, abEt, abOk, zl, zs, titre, im,
    hedef: { begen: [X0 + 70, yc + 4], abone: [AX + 230, yc + 8], zil: [zc + 4, yc + 6] }, tiklar: [] };
}

// The click order follows the sentence. Two forms:
//   { tiklar: [['abone', t], ['begen', t], ['zil', t]] }   order and times come from outside (the bell is optional; a button that is not given is not pressed)
//   { abone: t, begen: t, zil: t }                       with keys (sorted by time)
// If none is given, a placeholder: abone t0 + 1.5 · begen t0 + 2.6 · zil t0 + 3.6.
export function destekGoster(tl, d, t0, { tiklar, begen, abone, zil, t1 = t0 + DESTEK_SURE, arka = [] } = {}) {
  let sira = tiklar ? tiklar.map(([ne, t]) => [ne, t])
    : [['begen', begen], ['abone', abone], ['zil', zil]].filter(([, t]) => t != null);
  if (!sira.length) sira = [['abone', t0 + 1.5], ['begen', t0 + 2.6], ['zil', t0 + 3.6]];
  sira.sort((a, b) => a[1] - b[1]);
  for (const [ne] of sira) if (!d.hedef[ne]) throw new Error(`support card: unknown click "${ne}"`);
  d.tiklar = sira.map(([, t]) => t); d.sira = sira;
  if (arka.length) tl.to(arka, { autoAlpha: 0, y: -24, duration: 0.45, ease: 'power2.in' }, t0);
  tl.to(d.k, { autoAlpha: 1, duration: 0.4, ease: 'power1.out' }, t0 + 0.15);
  B.ac(tl, d.kn, t0 + 0.3, { d: 0.45 }); B.ac(tl, d.ser, t0 + 0.4, { d: 0.45 });
  [d.bg, d.ab, d.zl].forEach((e, i) => tl.fromTo(e, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, t0 + 0.35 + i * 0.1));
  // cursor: enters from the bottom right, reaches each button just before the click, leaves to the bottom right after the last click
  const git = (h, t, d0) => tl.to(d.im, { x: h[0], y: h[1], duration: d0, ease: 'power2.inOut' }, t - d0 - 0.06);
  const bas = (t) => tl.fromTo(d.im, { scale: 1 }, { scale: 0.82, duration: 0.07, ease: 'power1.in', yoyo: true, repeat: 1, immediateRender: false }, t - 0.02);
  const ilk = sira[0][1];
  tl.to(d.im, { autoAlpha: 1, duration: 0.2 }, Math.max(t0 + 0.3, Math.min(ilk - 0.8, t0 + 0.8)));
  let onceki = Math.max(t0 + 0.5, ilk - 1.2);
  for (const [ne, t] of sira) { git(d.hedef[ne], t, Math.max(0.2, Math.min(0.6, t - onceki - 0.15))); bas(t); onceki = t; }
  const [sonNe, sonT] = sira[sira.length - 1];
  tl.to(d.im, { x: d.hedef[sonNe][0] + 150, y: d.hedef[sonNe][1] + 170, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, sonT + 0.45);
  const ETKI = {
    // like: the thumb fills and bounces; an amber +1 rises
    begen: (t) => {
      const P = d.bp;
      tl.to(P.dolgu, { autoAlpha: 1, duration: 0.12 }, t);
      tl.fromTo(d.bg, { scale: 1 }, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, t);
      tl.fromTo(P.s, { y: 0, rotation: 0 }, { y: -12, rotation: -12, duration: 0.16, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false, transformOrigin: '30% 90%' }, t + 0.04);
      tl.fromTo(d.art1, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: -26, duration: 0.45, ease: 'power2.out', immediateRender: false }, t + 0.05);
      tl.to(d.art1, { autoAlpha: 0, y: -40, duration: 0.3, ease: 'power1.in' }, t + 1.1);   // reading time >= 0.6 s
    },
    // subscribe: red → grey SUBSCRIBED
    abone: (t) => {
      tl.fromTo(d.ab, { scale: 1 }, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, t);
      tl.to(d.ab, { backgroundColor: GRI, duration: 0.2 }, t + 0.06);
      tl.to(d.abEt, { autoAlpha: 0, duration: 0.12 }, t + 0.04); tl.to(d.abOk, { autoAlpha: 1, duration: 0.2 }, t + 0.12);
    },
    // bell: fills, rings, vibration lines
    zil: (t) => {
      const Z = d.zs;
      tl.to(Z.dolgu, { autoAlpha: 1, duration: 0.12 }, t);
      tl.fromTo(d.zl, { scale: 1 }, { scale: 0.93, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, t);
      const sal = gsap.timeline(); [16, -13, 9, -5, 2, 0].forEach((r) => sal.to(Z.s, { rotation: r, duration: 0.09, ease: 'sine.inOut', transformOrigin: '50% 12%' }));
      tl.add(sal, t + 0.03);
      d.titre.forEach((p, i) => { tl.fromTo(p, { drawSVG: '50% 50%', autoAlpha: 1 }, { drawSVG: '0% 100%', duration: 0.18, immediateRender: false }, t + 0.05 + (i % 2) * 0.08); tl.to(p, { autoAlpha: 0, duration: 0.25 }, t + 0.45 + (i % 2) * 0.08); });
    },
  };
  for (const [ne, t] of sira) ETKI[ne](t);
  // exit
  tl.to(d.k, { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t1 - 0.35);
  return tl;
}
