// Dikey (Shorts) ortak parçalar: künye, kanca ekran yazısı, kelime kelime altyazı, kapanış kartı.
import { katman, yazi, svgK, sv, yol, ciz, ac, R } from './bilesen.js';
import { KANAL } from './kimlik.js';

// üst künye: seri · ders (Mono, ikincil); bütün video boyunca
export function kunye(par, tl, sure, metin) {
  metin = metin || (KANAL.seri || KANAL.ad).toLocaleUpperCase(KANAL.dil || 'tr');
  const e = document.createElement('div'); e.className = 'kunye'; e.textContent = metin; par.appendChild(e);
  return e;
}

// kanca ekran yazısı: 0. karede tam görünür; bitince yukarı kayıp söner
export function kanca(par, tl, metin, bitis, { top = 236 } = {}) {
  const e = document.createElement('div'); e.className = 'kanca'; e.textContent = metin; e.style.top = top + 'px'; if (metin.includes('\n')) e.style.whiteSpace = 'pre-line'; par.appendChild(e);
  tl.set(e, { autoAlpha: 1 }, 0);
  tl.to(e, { autoAlpha: 0, y: -40, duration: 0.4, ease: 'power2.in' }, bitis);
  return e;
}

// ---- kelime kelime altyazı ----
// Parçalar: cümle içinde 2–4 kelime, ≤ 26 karakter; virgül, noktalı virgül ve iki noktada kırılır. 0,6 sn'den kısa parça
// (aynı cümlede, toplam ≤ 5 kelime ve ≤ 30 karakterse) sonrakiyle birleşir. Parça ilk kelimeden 0,05 sn önce açılır;
// kelimeler söylendikçe belirir (yer baştan ayrılmış, kayma yok). Bitiş: son kelime + 0,40 sn, en geç sonraki parça − 0,01 sn.
export function parcalara(Z) {
  const out = [];
  for (let c = 0; c < Z.cumleler.length; c++) {
    const ks = Z.kelimeler.filter((w) => w.c === c); let p = [];
    const kapat = () => { if (p.length) out.push({ c, k: p }); p = []; };
    for (const w of ks) {
      const uz = p.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
      if (p.length && (p.length >= 4 || uz > 26)) kapat();
      p.push(w);
      if (/[,;:]$/.test(w.w)) kapat();
    }
    kapat();
  }
  // kısa parçaları birleştir
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i], b = out[i + 1];
    const d = a.k[a.k.length - 1].t1 - a.k[0].t0, n = a.k.length + b.k.length, uz = [...a.k, ...b.k].reduce((x, w) => x + w.w.length + 1, 0);
    if (d < 0.6 && a.c === b.c && n <= 5 && uz <= 35) { a.k = [...a.k, ...b.k]; out.splice(i + 1, 1); i--; }
  }
  // tek kelimelik son parça (dul) öncekine eklenir, sığıyorsa
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1], b = out[i];
    if (b.k.length === 1 && a.c === b.c && a.k.length <= 4 && [...a.k, ...b.k].reduce((x, w) => x + w.w.length + 1, 0) <= 32) { a.k = [...a.k, ...b.k]; out.splice(i, 1); i--; }
  }
  for (let i = 0; i < out.length; i++) {
    const p = out[i], sonraki = out[i + 1];
    p.t0 = +(p.k[0].t0 - 0.05).toFixed(3);
    p.t1 = +Math.min(p.k[p.k.length - 1].t1 + 0.40, sonraki ? sonraki.k[0].t0 - 0.06 : 1e9).toFixed(3);
    p.metin = p.k.map((w) => w.w).join(' ');
  }
  return out;
}
export function altyazi(par, tl, Z, { gizle = [] } = {}) {
  const k = katman(par, 'altyazi'); const ps = parcalara(Z);
  for (const p of ps) {
    if (gizle.includes(p.c)) continue;
    const e = document.createElement('div'); e.className = 'alt'; k.appendChild(e);
    const sp = p.k.map((w, i) => { const s = document.createElement('span'); s.textContent = w.w + (i < p.k.length - 1 ? ' ' : ''); e.appendChild(s); return s; });
    gsap.set(e, { autoAlpha: 0 }); gsap.set(sp, { autoAlpha: 0 });
    tl.set(e, { autoAlpha: 1 }, p.t0);
    p.k.forEach((w, i) => tl.fromTo(sp[i], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.12, ease: 'power2.out' }, Math.max(p.t0, w.t0 - 0.03)));
    tl.set(e, { autoAlpha: 0 }, p.t1);
  }
  window.ALTYAZI = ps.map((p) => ({ c: p.c, t0: p.t0, t1: p.t1, metin: p.metin }));
  return k;
}

// ---- tam video kartı: kapanış cümlesinde; kapak şablonunun dikey özeti (plaka, seri şeridi, başlık, süre) ----
// Örnek: { no: '02', ad: ['Birinci satır', 'ikinci satır'], boy: 88, sure: '12:30' }
export function dersKarti(par, { y = 560, no: noM = '01', ad = ['Video başlığı', 'ikinci satır'], boy = 112, sure = '00:00' } = {}) {
  const k = katman(par, 'ders-karti'); gsap.set(k, { autoAlpha: 0 });
  const s = svgK(k);
  const plaka = sv(s, 'rect', { x: 72, y, width: 200, height: 170, rx: 8, fill: R.metin }); gsap.set(plaka, { autoAlpha: 0, transformOrigin: '50% 50%' });
  const no = yazi(k, noM, { x: 172, y: y + 85, boy: 118, ag: 700, sayi: true, hiza: 'orta', dikey: 'orta' }); no.style.color = R.zemin;
  const serit = yol(s, `M310,${y + 10} L310,${y + 160}`, 'c v');
  const [ss1, ss2 = ''] = (KANAL.seri || KANAL.ad).split(/,\s*|\s(?=\S+$)/);
  const s1 = yazi(k, ss2 ? ss1 + ',' : ss1, { x: 336, y: y + 22, boy: 60, ag: 800 });
  const s2 = yazi(k, ss2, { x: 336, y: y + 92, boy: 60, ag: 800 });
  const cz = yol(s, `M72,${y + 250} L918,${y + 250}`, 'c ince');
  const satir = ad.map((t, i) => yazi(k, t, { x: 72, y: y + 300 + i * boy * 1.07, boy, ag: 800 }));
  const tam = yazi(k, `${KANAL.metinler?.tam_video || 'TAM VİDEO'} · ${sure}`, { x: 72, y: y + 300 + ad.length * boy * 1.07 + 50, boy: 34, ag: 600, sayi: true, renk: 'ik', ls: 0.06 });
  return { k, plaka, no, serit, s1, s2, cz, satir, ad1: satir[0], ad2: satir[1], tam };
}
export function dersKartiGoster(tl, d, t0) {
  tl.set(d.k, { autoAlpha: 1 }, t0);
  tl.fromTo(d.plaka, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, t0);
  ac(tl, d.no, t0 + 0.1, { tur: 'ani' });
  tl.fromTo(d.no, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t0 + 0.15);
  ciz(tl, d.serit, t0 + 0.2, 0.35); ac(tl, [d.s1], t0 + 0.3, { d: 0.45 }); ac(tl, [d.s2], t0 + 0.4, { d: 0.45 });
  ciz(tl, d.cz, t0 + 0.5, 0.6);
  d.satir.forEach((e, i) => ac(tl, e, t0 + 0.7 + i * 0.15, { d: 0.55 }));
  ac(tl, d.tam, t0 + 1.2, { d: 0.45 });
  return tl;
}

// ---- standart abone kapanışı: dikey ABONE OL düğmesi + imleç tıklaması (destek.js düğmesinin dikey hâli) ----
// Tıklama kapanış cümlesindeki "abone" kelimesine kilitli; ses tarafında onaylı tik efekti aynı ana konur (kapanis_ekle.mjs).
const KIRMIZI = KANAL.renkler?.abone_dugmesi || '#FF0033', GRI = '#2E3138', IMLEC = 'M0,0 L0,36 L9,27.5 L15.5,42 L22,39 L15.6,25 L27,25 Z';
export function aboneDugmesi(par, { x = 495, y = 1300, w = 420, h = 104 } = {}) {
  const d = document.createElement('div');
  Object.assign(d.style, { position: 'absolute', left: x - w / 2 + 'px', top: y - h / 2 + 'px', width: w + 'px', height: h + 'px', borderRadius: h / 2 + 'px', background: KIRMIZI });
  par.appendChild(d); gsap.set(d, { autoAlpha: 0 });
  const et = (txt, boy, ag) => { const e = document.createElement('div'); e.textContent = txt; Object.assign(e.style, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', lineHeight: 1, fontFamily: 'var(--baslik)', fontSize: boy + 'px', fontWeight: ag, color: R.metin }); d.appendChild(e); return e; };
  const ol = et(KANAL.metinler?.abone_ol || 'ABONE OL', 40, 800), oldu = et(KANAL.metinler?.abone_olundu || 'ABONE OLUNDU', 34, 700); gsap.set(oldu, { autoAlpha: 0 });
  const NS = 'http://www.w3.org/2000/svg';
  const im = document.createElementNS(NS, 'svg'); im.setAttribute('width', 44); im.setAttribute('height', 66); im.setAttribute('viewBox', '-2 -2 31 46');
  Object.assign(im.style, { position: 'absolute', left: '0px', top: '0px', overflow: 'visible' }); par.appendChild(im);
  const p = document.createElementNS(NS, 'path'); p.setAttribute('d', IMLEC); Object.entries({ fill: R.metin, stroke: R.zemin, 'stroke-width': 2, 'stroke-linejoin': 'round' }).forEach(([a, v]) => p.setAttribute(a, v)); im.appendChild(p);
  gsap.set(im, { autoAlpha: 0, x: x + 330, y: y + 110, transformOrigin: '0% 0%' });   // altyazı kuşağına girmeden sağdan gelir
  return { d, ol, oldu, im, x, y };
}
export function aboneGoster(tl, a, t0, tTik) {
  tl.fromTo(a.d, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, t0);
  tl.to(a.im, { autoAlpha: 1, duration: 0.2 }, tTik - 0.9);
  tl.to(a.im, { x: a.x + 60, y: a.y + 10, duration: 0.6, ease: 'power2.inOut' }, tTik - 0.66);
  tl.fromTo(a.im, { scale: 1 }, { scale: 0.82, duration: 0.07, ease: 'power1.in', yoyo: true, repeat: 1, immediateRender: false }, tTik - 0.02);
  tl.fromTo(a.d, { scale: 1 }, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, tTik);
  tl.to(a.d, { backgroundColor: GRI, duration: 0.2 }, tTik + 0.06);
  tl.to(a.ol, { autoAlpha: 0, duration: 0.12 }, tTik + 0.04); tl.to(a.oldu, { autoAlpha: 1, duration: 0.2 }, tTik + 0.12);
  tl.to(a.im, { x: a.x + 330, y: a.y + 90, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, tTik + 0.45);
  return tl;
}
// Kapanış: video kartı (üstte, y 470) + ABONE OL (altta). Z.kapanis varsa (kapanis_ekle.mjs) kartın başlangıcı kapanış cümlesinin
// başı, tıklama "abone" kelimesi; yoksa yalnız video kartı.
export function kapanis(par, tl, Z, { t0, kart = {} } = {}) {
  const k = Z.kapanis;
  const dk = dersKarti(par, { y: k ? 470 : 560, ...kart });
  dersKartiGoster(tl, dk, t0);
  if (!k) return { dk };
  const a = aboneDugmesi(par, { y: 1300 });
  aboneGoster(tl, a, Math.max(t0 + 0.4, k.abone - 1.2), k.abone);
  return { dk, a };
}
