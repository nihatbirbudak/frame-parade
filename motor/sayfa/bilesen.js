// Bileşen kitaplığı (16:9 ve 9:16 ortak). Her bileşen iki parçadır: (1) DOM/SVG kurulumu (başta görünmez),
// (2) zaman çizelgesine eklenen giriş/çıkış/dönüşüm. Bütün tween'ler mutlak zamanda (sn) ve fromTo ile yazılır ki
// rastgele seek aynı kareyi versin. Stil kartı (taslak 19 Kas 14:06): girişler silme/çizme ile, solma yalnız çıkışta;
// çizgi 3 px, vurgu 5 px amber; köşe 6 px; tek vurgu rengi; oklar SVG ile (mono fontta "→" yok).
// Kitaplık: yazi · kutu · cip · svgK/yol/ok (çizgi) · izgara (piksel ızgarası) · sayac/hesap (sayı hesabı) · vektor
// (vektör kutusu) · egri (saçılım + eğri) · zincir (sistem zinciri) · bolumKarti · olcuCizgisi · dalga.
import { KANAL, M } from './kimlik.js';
// renkler kanal.json › renkler'den (varsayılan nötr)
export const R = { zemin: '#111214', yuzey: '#1A1C20', cizgi: '#2C2F36', ik: '#9A9EA6', metin: '#EEEEEE', vu: '#4C9AFF', ...(KANAL.renkler || {}) };
const NS = 'http://www.w3.org/2000/svg';

export function katman(par, ad) { const d = document.createElement('div'); d.className = 'kat'; if (ad) d.dataset.ad = ad; par.appendChild(d); gsap.set(d, { autoAlpha: 1 }); return d; }

// ---- yazı ----
export function yazi(par, txt, { x, y, boy = 48, ag = 700, sayi = false, renk = 'metin', hiza = 'sol', dikey = 'ust', lang, ls, sinif = '' } = {}) {
  const e = document.createElement('div');
  e.className = `y ${sayi ? 'sayi' : ''} ${renk === 'ik' ? 'ik' : renk === 'vu' ? 'vu' : ''} ${sinif}`;
  e.textContent = txt; if (lang) e.lang = lang;
  Object.assign(e.style, { left: x + 'px', top: y + 'px', fontSize: boy + 'px', fontWeight: ag });
  if (ls != null) e.style.letterSpacing = ls + 'em';
  else if (!sayi && boy >= 90) e.style.letterSpacing = '-0.025em';
  else if (!sayi && boy >= 44) e.style.letterSpacing = '-0.015em';
  par.appendChild(e);
  const tx = hiza === 'orta' ? -50 : hiza === 'sag' ? -100 : 0, ty = dikey === 'orta' ? -50 : dikey === 'alt' ? -100 : 0;
  gsap.set(e, { xPercent: tx, yPercent: ty, autoAlpha: 0 });
  return e;
}

// giriş: 'sil' (soldan sağa silme), 'olcek' (yerinde büyüme), 'yukari' (alttan kayma + silme)
export function ac(tl, e, t, { d = 0.5, tur = 'sil', ease } = {}) {
  const els = Array.isArray(e) ? e : [e];
  for (const el of els) {
    if (tur === 'sil') {
      tl.set(el, { autoAlpha: 1 }, t);
      tl.fromTo(el, { clipPath: 'inset(-40% 100% -40% -4%)' }, { clipPath: 'inset(-40% -4% -40% -4%)', duration: d, ease: ease || 'power2.inOut' }, t);
    } else if (tur === 'olcek') {
      tl.fromTo(el, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: d, ease: ease || 'back.out(1.6)' }, t);
    } else if (tur === 'yukari') {
      tl.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: d, ease: ease || 'power3.out' }, t);
    } else if (tur === 'ani') tl.set(el, { autoAlpha: 1 }, t);
  }
  return tl;
}
export function kapa(tl, e, t, d = 0.35) { tl.to(e, { autoAlpha: 0, duration: d, ease: 'power1.in' }, t); return tl; }
export function tasi(tl, e, t, props, d = 0.6, ease = 'power3.inOut') { tl.to(e, { ...props, duration: d, ease }, t); return tl; }

// vurgu: div (kenar + yazı) ya da SVG (çizgi/dolgu) amber'e geçer; sondur eski hâline
export function vurgula(tl, e, t, d = 0.3) {
  for (const el of Array.isArray(e) ? e : [e]) {
    if (el instanceof SVGElement) { const dolgu = el.tagName === 'rect' && el.dataset.dolgu; tl.to(el, dolgu ? { attr: { fill: R.vu }, duration: d } : { stroke: R.vu, duration: d }, t); }
    else if (el.classList.contains('y')) tl.to(el, { color: R.vu, duration: d }, t);
    else { tl.to(el, { borderColor: R.vu, duration: d }, t); const et = el.querySelector('.et'); if (et) tl.to(et, { color: R.vu, duration: d }, t); }
  }
  return tl;
}
export function sondur(tl, e, t, d = 0.3, renk = R.ik) {
  for (const el of Array.isArray(e) ? e : [e]) {
    if (el instanceof SVGElement) tl.to(el, el.tagName === 'rect' && el.dataset.dolgu ? { attr: { fill: renk }, duration: d } : { stroke: renk, duration: d }, t);
    else if (el.classList.contains('y')) tl.to(el, { color: renk === R.ik ? R.ik : R.metin, duration: d }, t);
    else { tl.to(el, { borderColor: renk, duration: d }, t); const et = el.querySelector('.et'); if (et) tl.to(et, { color: R.metin, duration: d }, t); }
  }
  return tl;
}

// ---- kutu ve çip ----
export function kutu(par, { x, y, w, h, et = '', boy = 40, bos = false, hiza = 'orta', ag = 700 } = {}) {
  const e = document.createElement('div'); e.className = 'kutu' + (bos ? ' bos' : '');
  Object.assign(e.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  if (et) { const s = document.createElement('div'); s.className = 'et'; s.textContent = et; s.style.fontSize = boy + 'px'; s.style.fontWeight = ag; e.appendChild(s); }
  par.appendChild(e);
  gsap.set(e, { autoAlpha: 0, xPercent: hiza === 'orta' ? -50 : 0, yPercent: hiza === 'orta' ? -50 : 0 });
  return e;
}
export function cip(par, txt, { x, y, boy = 40, hiza = 'orta', sayi = false } = {}) {
  const e = document.createElement('div'); e.className = 'cip'; e.textContent = txt; e.style.fontSize = boy + 'px';
  if (sayi) { e.style.fontFamily = 'var(--sayi)'; e.style.fontWeight = 500; }
  Object.assign(e.style, { left: x + 'px', top: y + 'px' }); par.appendChild(e);
  gsap.set(e, { autoAlpha: 0, xPercent: hiza === 'orta' ? -50 : 0, yPercent: hiza === 'orta' ? -50 : 0 });
  return e;
}

// ---- çizgi ----
export function svgK(par) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'k'); s.setAttribute('width', 1920); s.setAttribute('height', 1080); s.setAttribute('viewBox', '0 0 1920 1080'); par.appendChild(s); return s; }
export function sv(par, tag, attrs = {}) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); par.appendChild(e); return e; }
export function yol(svg, d, cls = 'c') { const p = sv(svg, 'path', { d, class: cls }); gsap.set(p, { drawSVG: '0%' }); return p; }
export function ciz(tl, p, t, d = 0.5, ease = 'power2.out') { for (const el of Array.isArray(p) ? p : [p]) tl.fromTo(el, { drawSVG: '0%' }, { drawSVG: '100%', duration: d, ease }, t); return tl; }
// silinen çizgi sonunda gizlenir: drawSVG '100% 100%' yuvarlak uçlu çizgide nokta bırakıyordu
export function sil(tl, p, t, d = 0.4) { for (const el of Array.isArray(p) ? p : [p]) { tl.to(el, { drawSVG: '100% 100%', duration: d, ease: 'power2.in' }, t); tl.set(el, { autoAlpha: 0 }, t + d); } return tl; }
// açık "V" uçlu ok (14 px uç, stil kartı §4)
export function ok(svg, x1, y1, x2, y2, cls = 'c') {
  const a = Math.atan2(y2 - y1, x2 - x1), u = 16, ac = 0.5;
  const govde = yol(svg, `M${x1},${y1} L${x2},${y2}`, cls);
  const uc = yol(svg, `M${x2 - u * Math.cos(a - ac)},${y2 - u * Math.sin(a - ac)} L${x2},${y2} L${x2 - u * Math.cos(a + ac)},${y2 - u * Math.sin(a + ac)}`, cls);
  return { govde, uc, ikisi: [govde, uc] };
}
export function okCiz(tl, o, t, d = 0.45) { ciz(tl, o.govde, t, d); ciz(tl, o.uc, t + d * 0.85, 0.15); return tl; }
// ölçü çizgisi: iki uçta 12 px çentik, ortada mono değer
export function olcuCizgisi(svg, x1, y1, x2, y2, deger, { yon = 'ust' } = {}) {
  const g = sv(svg, 'g'); const dik = Math.abs(y2 - y1) > Math.abs(x2 - x1);
  const c = dik ? `M${x1 - 6},${y1} L${x1 + 6},${y1} M${x2 - 6},${y2} L${x2 + 6},${y2}` : `M${x1},${y1 - 6} L${x1},${y1 + 6} M${x2},${y2 - 6} L${x2},${y2 + 6}`;
  const p1 = yol(g, `M${x1},${y1} L${x2},${y2}`, 'olcu'), p2 = yol(g, c, 'olcu');
  const tx = sv(g, 'text', { x: dik ? x1 + (yon === 'sag' ? 18 : -18) : (x1 + x2) / 2, y: dik ? (y1 + y2) / 2 + 8 : y1 + (yon === 'ust' ? -16 : 34), 'text-anchor': dik ? (yon === 'sag' ? 'start' : 'end') : 'middle', 'font-size': 24, 'font-weight': 500 });
  tx.textContent = deger; gsap.set(tx, { autoAlpha: 0 });
  return { g, cizgiler: [p1, p2], yazi: tx };
}
export function olcuAc(tl, o, t) { ciz(tl, o.cizgiler, t, 0.45); tl.fromTo(o.yazi, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, t + 0.3); return tl; }

// ---- piksel ızgarası ----
export function izgara(par, { x, y, sut, sat, k = 24, ara = 6, renk = R.cizgi } = {}) {
  const svg = svgK(par), g = sv(svg, 'g'), kareler = [];
  for (let r = 0; r < sat; r++) for (let c = 0; c < sut; c++) {
    const e = sv(g, 'rect', { x: x + c * (k + ara), y: y + r * (k + ara), width: k, height: k, rx: 3, fill: renk, 'data-dolgu': 1 });
    gsap.set(e, { autoAlpha: 0, transformOrigin: '50% 50%' }); kareler.push(e);
  }
  return { svg, g, kareler, k, ara, x, y, sut, sat, gen: sut * (k + ara) - ara, yuk: sat * (k + ara) - ara, merkez: (i) => ({ cx: x + (i % sut) * (k + ara) + k / 2, cy: y + Math.floor(i / sut) * (k + ara) + k / 2 }) };
}
// dalga hâlinde (sol üstten çapraz) belirme
export function izgaraAc(tl, z, t, d = 1.2) {
  tl.fromTo(z.kareler, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: { each: d / (z.sut + z.sat), grid: [z.sat, z.sut], from: 'start', axis: null } }, t);
  return tl;
}

// ---- sayı hesabı ----
// sayac: yazının içindeki sayıyı a'dan b'ye döndürür (mono, tabular). Ön/son ek ayrı span değil: bicim(v) ile.
// Sayaçlar zaman çizelgesine değil, render(t) içinde doğrudan t'den hesaplanır (seek'te geri çağrı gerekmez, deterministik).
export const SAYACLAR = [];
export function sayac(tl, e, t, a, b, d = 0.6, bicim = (v) => String(Math.round(v))) { SAYACLAR.push({ e, t, a, b, d, bicim }); return tl; }
const io = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
// Sürekli dönüşüm: GUNCELLE'ye eklenen fn(t) her karede render(t) içinde çağrılır; değerler t'den hesaplanır.
// parca(t, [[t0, v0], [t1, v1], …]) parça parça yumuşak geçiş (smoothstep), uçlarda sabit.
export const GUNCELLE = [];
export const guncelle = (fn) => GUNCELLE.push(fn);
export function parca(t, noktalar) {
  if (t <= noktalar[0][0]) return noktalar[0][1];
  for (let i = 1; i < noktalar.length; i++) { const [a, va] = noktalar[i - 1], [b, vb] = noktalar[i]; if (t <= b) { const u = (t - a) / Math.max(1e-6, b - a), s = u * u * (3 - 2 * u); return va + (vb - va) * s; } }
  return noktalar[noktalar.length - 1][1];
}
export function sayacGuncelle(t) {
  for (const fn of GUNCELLE) fn(t);
  const son = new Map();                                   // aynı öğede: başlamış en son sayaç; hiçbiri başlamadıysa en erken olanı
  for (const s of SAYACLAR) {
    const o = son.get(s.e);
    if (!o) { son.set(s.e, s); continue; }
    const sB = s.t <= t, oB = o.t <= t;
    if ((sB && (!oB || s.t > o.t)) || (!sB && !oB && s.t < o.t)) son.set(s.e, s);
  }
  for (const [e, s] of son) { const u = Math.min(1, Math.max(0, (t - s.t) / s.d)); e.textContent = s.bicim(s.a + (s.b - s.a) * io(u)); }
}
// hesap satırı: parçalar sırayla belirir ("990", "÷", "1000", "=", "%99"); her parça kendi kelime anında
export function hesap(par, parcalar, { x, y, boy = 72, ara = 28, hiza = 'sol' } = {}) {
  const els = []; let cx = x;
  const kap = document.createElement('div'); kap.style.position = 'absolute'; kap.style.left = x + 'px'; kap.style.top = y + 'px';
  kap.style.display = 'flex'; kap.style.gap = ara + 'px'; kap.style.alignItems = 'baseline'; par.appendChild(kap);
  if (hiza === 'orta') gsap.set(kap, { xPercent: -50 });
  for (const p of parcalar) {
    const e = document.createElement('div'); e.className = 'y sayi' + (p.vu ? ' vu' : p.ik ? ' ik' : '');
    e.style.position = 'relative'; e.style.fontSize = (p.boy || boy) + 'px'; e.textContent = p.t; kap.appendChild(e);
    gsap.set(e, { autoAlpha: 0 }); els.push(e);
  }
  return { kap, els };
}

// ---- vektör kutusu: köşeli parantez içinde satırlar (etiket + değer yuvası) ----
export function vektor(par, { x, y, etiketler, satir = 64, gen = 380, boy = 32 } = {}) {
  const svg = svgK(par), h = etiketler.length * satir + 24;
  const sol = yol(svg, `M${x + 18},${y} L${x},${y} L${x},${y + h} L${x + 18},${y + h}`, 'c m');
  const sag = yol(svg, `M${x + gen - 18},${y} L${x + gen},${y} L${x + gen},${y + h} L${x + gen - 18},${y + h}`, 'c m');
  const satirlar = etiketler.map((et, i) => yazi(par, et, { x: x + 32, y: y + 12 + i * satir + satir / 2, boy, ag: 600, dikey: 'orta' }));
  return { svg, sol, sag, satirlar, h, x, y, gen, satirY: (i) => y + 12 + i * satir + satir / 2 };
}
export function vektorAc(tl, v, t) { ciz(tl, [v.sol, v.sag], t, 0.4); return tl; }

// ---- eğri: saçılım noktaları + uydurulmuş çizgi (yalnız şekil; eksen sayısı yok) ----
export function egri(par, { x, y, w, h, noktalar, egriD } = {}) {
  const svg = svgK(par);
  const eks = yol(svg, `M${x},${y} L${x},${y + h} L${x + w},${y + h}`, 'c ince');
  const nk = noktalar.map(([u, v]) => { const c = sv(svg, 'circle', { cx: x + u * w, cy: y + h - v * h, r: 7, fill: R.metin }); gsap.set(c, { autoAlpha: 0, transformOrigin: '50% 50%' }); return c; });
  const cizgi = egriD ? yol(svg, egriD(x, y, w, h), 'c v') : null;
  return { svg, eks, nk, cizgi };
}

// ---- sistem zinciri: kutular + oklar ----
export function zincir(par, adlar, { x, y, w = 240, h = 110, ara = 90, boy = 34 } = {}) {
  const svg = svgK(par), kutular = [], oklar = [];
  adlar.forEach((ad, i) => {
    const kx = x + i * (w + ara);
    kutular.push(kutu(par, { x: kx, y, w, h, et: ad, boy, hiza: 'sol' }));
    if (i > 0) oklar.push(ok(svg, kx - ara + 14, y + h / 2, kx - 14, y + h / 2));
  });
  return { svg, kutular, oklar, merkez: (i) => ({ cx: x + i * (w + ara) + w / 2, cy: y + h / 2 }), gen: adlar.length * (w + ara) - ara };
}
export function zincirAc(tl, z, t, aralik = 0.25) {
  z.kutular.forEach((k, i) => { ac(tl, k, t + i * aralik, { tur: 'olcek', d: 0.4 }); if (i > 0) okCiz(tl, z.oklar[i - 1], t + i * aralik - 0.12, 0.25); });
  return tl;
}

// ---- bölüm kartı (1,5 sn; YouTube bölüm adıyla aynı) ----
// Yönetici kararı 19 Kas: ders numarası biçimi (büyük amber "01") burada KULLANILMAZ; küçük Mono "BÖLÜM N" künyesi + ad.
export function bolumKarti(par, { no, baslik, ders = 1, seri = KANAL.seri }) {
  const k = katman(par, 'kart'); k.style.background = 'var(--zemin)'; gsap.set(k, { autoAlpha: 0 });   // tam zemin: alttaki sahnenin sönüşünü örter
  const svg = svgK(k);
  const ust = yol(svg, 'M96,470 L1824,470', 'c ince');
  const cent = yol(svg, 'M96,440 L96,470', 'c v');
  const n = yazi(k, no ? `${M('bolum', 'BÖLÜM')} ${no}` : M('kapanis', 'KAPANIŞ'), { x: 116, y: 430, boy: 28, ag: 600, sayi: true, ls: 0.08 });
  const ser = yazi(k, `${seri} · ${M('ders', 'Ders')} ${ders}`.toLocaleUpperCase('tr'), { x: 1824, y: 434, boy: 22, ag: 600, sayi: true, renk: 'ik', ls: 0.08, hiza: 'sag' });
  const b = yazi(k, baslik, { x: 96, y: 506, boy: 112, ag: 800 });
  return { k, ust, cent, ser, n, b };
}
export function kartGoster(tl, kart, t0, t1) {
  tl.set(kart.k, { autoAlpha: 1 }, t0);
  ciz(tl, kart.ust, t0, 0.5); ciz(tl, kart.cent, t0 + 0.1, 0.2);
  ac(tl, kart.ser, t0 + 0.15, { d: 0.4 }); ac(tl, kart.n, t0 + 0.2, { d: 0.45 }); ac(tl, kart.b, t0 + 0.35, { d: 0.55 });
  tl.to(kart.k, { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, t1 - 0.35);
  return tl;
}

// ---- ses dalgası (sinüs toplamı; anlamı "dinleyerek") ----
export function dalgaD(x, y, w, gen = 60, n = 6) {
  let d = `M${x},${y}`;
  for (let i = 0; i <= 240; i++) { const u = i / 240, zarf = Math.sin(Math.PI * u); const v = zarf * gen * (0.6 * Math.sin(u * n * 2 * Math.PI) + 0.4 * Math.sin(u * n * 5.3 * Math.PI)); d += ` L${(x + u * w).toFixed(1)},${(y + v).toFixed(1)}`; }
  return d;
}

// ======================= VİDEO KİMLİĞİ BİLEŞENLERİ (yonetim/VIDEO-KIMLIGI.md; her videoda birebir aynı) =======================
// Açılış geçişi (iskelet 2): kancadan sonra 1 sn; amber çentik yukarıdan seri şeridine iner, şerit çizilir. Logo yok.
export function acilisGecis(tl, par, t0, sure = 1.0) {
  const k = katman(par, 'acilis-gecis'), s = svgK(k);
  const cent = sv(s, 'line', { x1: 96, y1: 306, x2: 96, y2: 330, stroke: R.vu, 'stroke-width': 5, 'stroke-linecap': 'round' }); gsap.set(cent, { autoAlpha: 0 });
  const serit = yol(s, 'M96,330 L1824,330', 'c ince');
  tl.fromTo(cent, { autoAlpha: 1, y: -380 }, { y: 0, duration: sure * 0.55, ease: 'power3.in' }, t0);
  tl.fromTo(cent, { scaleY: 1 }, { scaleY: 0.7, transformOrigin: '50% 100%', duration: 0.08, yoyo: true, repeat: 1 }, t0 + sure * 0.55);
  ciz(tl, serit, t0 + sure * 0.5, sure * 0.5, 'power2.inOut');
  return { k, cent, serit };
}
// Ders künyesi (iskelet 3): seri şeridi, büyük amber ders numarası, ders adı, alt soru. Çentik ve şerit açılış geçişinden devralınır.
export function dersKunyesi(par, { no, ad, soru, seri = KANAL.seri }) {
  const k = katman(par, 'ders-kunyesi');
  const ser = yazi(k, seri, { x: 116, y: 288, boy: 30, ag: 600, renk: 'ik', ls: 0.04 });
  const n = yazi(k, String(no).padStart(2, '0'), { x: 96, y: 370, boy: 200, sayi: true, renk: 'vu' });
  const a = yazi(k, ad, { x: 460, y: 392, boy: 96, ag: 800 });
  const q = yazi(k, soru, { x: 464, y: 530, boy: 44, ag: 700, renk: 'ik' });
  return { k, ser, n, a, q };
}
export function dersKunyesiGoster(tl, d, t0, { soruT, son, gecis } = {}) {
  ac(tl, d.ser, t0); ac(tl, d.n, t0 + 0.1, { d: 0.55 }); ac(tl, d.a, t0 + 0.3, { d: 0.6 }); ac(tl, d.q, soruT ?? t0 + 1.0, { d: 0.6 });
  if (son != null) { tl.to(d.k, { y: -120, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, son); if (gecis) tl.to(gecis.k, { y: -120, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, son); }
  return tl;
}
// Kapanış (iskelet 7): 20 sn; logo (dosyadan okunur, yeni logo gelince yalnız bu sahne yeniden render edilir) + "Sonraki ders" kartı.
// Sol (96–620) ve sağ (1300–1824) alanlar YouTube son ekran öğeleri için boş bırakılır.
export function kapanisEkrani(par, { sonrakiNo, sonrakiAd, seri = KANAL.seri, logo = KANAL.logo }) {
  const k = katman(par, 'kapanis'); gsap.set(k, { autoAlpha: 0 });
  const img = document.createElement('img'); img.src = logo; Object.assign(img.style, { position: 'absolute', left: '840px', top: '150px', width: '240px', height: '240px' }); k.appendChild(img); gsap.set(img, { autoAlpha: 0 });
  const s = svgK(k); const cz = yol(s, 'M700,450 L1220,450', 'c ince'), cent = yol(s, 'M700,426 L700,450', 'c v');
  const sk = yazi(k, `Sonraki ders · Ders ${sonrakiNo}`.toLocaleUpperCase('tr'), { x: 720, y: 412, boy: 24, ag: 600, sayi: true, renk: 'ik', ls: 0.08 });
  const satir = Array.isArray(sonrakiAd) ? sonrakiAd : [sonrakiAd];
  const ad = satir.map((t, i) => yazi(k, t, { x: 960, y: 486 + i * 74, boy: 60, ag: 800, hiza: 'orta' }));
  const sr = yazi(k, seri.toLocaleUpperCase('tr'), { x: 960, y: 486 + satir.length * 74 + 30, boy: 24, ag: 600, sayi: true, renk: 'ik', ls: 0.08, hiza: 'orta' });
  return { k, img, cz, cent, sk, ad, sr };
}
export function kapanisGoster(tl, c, t0, t1) {
  tl.set(c.k, { autoAlpha: 1 }, t0);
  tl.fromTo(c.img, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, t0 + 0.1);
  ciz(tl, [c.cz, c.cent], t0 + 0.5, 0.5); ac(tl, c.sk, t0 + 0.7); c.ad.forEach((e, i) => ac(tl, e, t0 + 0.9 + i * 0.2, { d: 0.6 })); ac(tl, c.sr, t0 + 1.4);
  tl.to(c.k, { autoAlpha: 0, duration: 0.8 }, t1 - 0.8);
  return tl;
}
