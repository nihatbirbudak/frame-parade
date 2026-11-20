// günlük istatistik ve yorum çekimi. Yalnız okur, hiçbir şey değiştirmez.
// Kullanım: node youtube/analitik.mjs
// Çıktılar:
//   06-analitik/OZET.md          her videonun son durumu, +48 sa / +7 gün pencereleri, son yorumlar (her çalışmada yeniden yazılır)
//   06-analitik/veri/anlik.jsonl çalışma başına bir satır (ham sayılar; geçmiş buradan çizilir)
// Not: YouTube Analytics verisi 1–2 gün gecikmeli gelir; "—" veri henüz yok demektir. Görüntülenme sayısı Data API'den anlıktır.
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { api, KOK } from './api.mjs';

const ANALITIK = join(KOK, 'analitik');
const VERI = join(ANALITIK, 'veri');
mkdirSync(VERI, { recursive: true });

// Yerel adlar: isteğe bağlı analitik/videolar/kimlikler.json ({ videoId: ad }) + yükleme betiğinin youtube.json kayıtları
const KIM = join(ANALITIK, 'videolar', 'kimlikler.json');
const adlar = existsSync(KIM) ? JSON.parse(readFileSync(KIM, 'utf8')) : {};
function youtubeJsonTara(dizin, derinlik = 0) {
  if (derinlik > 4 || !existsSync(dizin)) return;
  for (const g of readdirSync(dizin, { withFileTypes: true })) {
    const y = join(dizin, g.name);
    if (g.isDirectory() && !['node_modules', 'v1', 'ses', 'cikti'].includes(g.name)) youtubeJsonTara(y, derinlik + 1);
    else if (g.name === 'youtube.json') {
      try { const k = JSON.parse(readFileSync(y, 'utf8')); if (k.videoId && !adlar[k.videoId]) adlar[k.videoId] = k.klasor.split(/[\\/]/).filter(s => s !== 'paket').pop(); } catch {}
    }
  }
}
youtubeJsonTara(join(KOK, 'projeler'));

const simdi = new Date();
const bugun = simdi.toLocaleDateString('sv-SE', { timeZone: 'America/Los_Angeles' }); // Analytics günleri Pasifik saatine göre

// 1. Videolar
const kanal = await api('https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics,snippet&mine=true');
const k = kanal.items[0];
const yuklenenler = k.contentDetails.relatedPlaylists.uploads;
const kimlikler = [];
let sayfa = '';
do {
  const p = await api(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${yuklenenler}${sayfa ? '&pageToken=' + sayfa : ''}`);
  kimlikler.push(...p.items.map(i => i.contentDetails.videoId));
  sayfa = p.nextPageToken || '';
} while (sayfa);

const videolar = [];
for (let i = 0; i < kimlikler.length; i += 50) {
  const v = await api(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics,contentDetails&id=${kimlikler.slice(i, i + 50).join(',')}`);
  videolar.push(...v.items);
}

function sureSn(iso) { const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; }
const satirlar = videolar.map(v => {
  const yayin = v.status.privacyStatus === 'public' ? new Date(v.snippet.publishedAt) : (v.status.publishAt ? new Date(v.status.publishAt) : null);
  const yayinda = v.status.privacyStatus === 'public';
  return {
    id: v.id, ad: adlar[v.id] || v.id, baslik: v.snippet.title, sure: sureSn(v.contentDetails.duration),
    tur: sureSn(v.contentDetails.duration) <= 180 ? 'Shorts' : 'Ders', durum: v.status.privacyStatus, yayinda,
    yayin: yayin ? yayin.toISOString() : null, yasSaat: yayinda && yayin ? Math.floor((simdi - yayin) / 3600_000) : null,
    goruntulenme: +(v.statistics.viewCount || 0), begeni: +(v.statistics.likeCount || 0), yorum: +(v.statistics.commentCount || 0),
  };
}).sort((a, b) => (a.yayin || '9').localeCompare(b.yayin || '9'));

// 2. Analytics (yayındaki videolar, yayın gününden bugüne)
const yayindakiler = satirlar.filter(s => s.yayinda);
if (yayindakiler.length) {
  const bas = yayindakiler.map(s => s.yayin.slice(0, 10)).sort()[0];
  const filtre = 'video==' + yayindakiler.map(s => s.id).join(',');
  const temel = 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares';
  try {
    const r = await api(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${bas}&endDate=${bugun}&metrics=${temel}&dimensions=video&filters=${encodeURIComponent(filtre)}`);
    const sutun = r.columnHeaders.map(c => c.name);
    for (const satir of r.rows || []) {
      const o = Object.fromEntries(sutun.map((c, i) => [c, satir[i]]));
      const s = satirlar.find(x => x.id === o.video);
      if (s) s.analitik = o;
    }
  } catch (e) { console.log('Analytics okunamadı:', e.message); }
  try { // Shorts için "izlemeye devam" yaklaşığı: engagedViews / views (alan her hesapta olmayabilir)
    const r = await api(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${bas}&endDate=${bugun}&metrics=views,engagedViews&dimensions=video&filters=${encodeURIComponent(filtre)}`);
    for (const satir of r.rows || []) { const s = satirlar.find(x => x.id === satir[0]); if (s) s.etkilesimli = satir[2]; }
  } catch { /* alan yoksa sessizce geç */ }
  // Tutma eğrisi (video başına; elapsedVideoTimeRatio 0,01 adımlı) ve trafik kaynağı
  for (const s of yayindakiler) {
    const tek = encodeURIComponent('video==' + s.id);
    try {
      const r = await api(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${bas}&endDate=${bugun}&metrics=audienceWatchRatio,relativeRetentionPerformance&dimensions=elapsedVideoTimeRatio&filters=${tek}`);
      if (r.rows?.length) s.tutma = r.rows.map(([oran, izleme, goreli]) => ({ oran, izleme, goreli }));
    } catch (e) { console.log(`  ${s.ad} tutma/trafik okunamadı: ${e.message.slice(0, 120)}`); }
    try {
      const r = await api(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${bas}&endDate=${bugun}&metrics=views&dimensions=insightTrafficSourceType&filters=${tek}&sort=-views`);
      if (r.rows?.length) s.trafik = r.rows.map(([kaynak, views]) => ({ kaynak, views }));
    } catch (e) { console.log(`  ${s.ad} tutma/trafik okunamadı: ${e.message.slice(0, 120)}`); }
  }
}

// 3. Yorumlar (son 10, metin; ad yazılmaz)
for (const s of yayindakiler) {
  if (!s.yorum) continue;
  try {
    const c = await api(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${s.id}&maxResults=10&order=time&textFormat=plainText`);
    s.yorumlar = (c.items || []).map(t => ({ zaman: t.snippet.topLevelComment.snippet.publishedAt, metin: t.snippet.topLevelComment.snippet.textDisplay.slice(0, 300), cevap: t.snippet.totalReplyCount }));
  } catch (e) { s.yorumlar = [{ zaman: '', metin: 'okunamadı: ' + e.message.slice(0, 100) }]; }
}

// 4. Yaz
appendFileSync(join(VERI, 'anlik.jsonl'), JSON.stringify({ zaman: simdi.toISOString(), abone: +k.statistics.subscriberCount, videolar: satirlar.map(({ yorumlar, ...x }) => x) }) + '\n');

const saat = simdi.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' });
const yuzde = (x) => x == null ? '—' : `%${(+x).toFixed(0)}`;
const sn = (x) => x == null ? '—' : `${(+x).toFixed(0)} sn`;
const pencere = (s) => s.yasSaat == null ? 'yayında değil' : s.yasSaat >= 168 ? '+7 gün geçti' : s.yasSaat >= 48 ? '+48 sa geçti' : `${48 - s.yasSaat} sa sonra +48`;
let md = `# özet\n\n_Otomatik: \`node youtube/analitik.mjs\` · ${saat} · abone ${k.statistics.subscriberCount} · Analytics verisi 1–2 gün gecikmeli ("—" = henüz yok)._\n\n`;
md += '| Ad | Tür | Durum | Yaş | Görüntülenme | Ort. izleme | Ort. izleme % | İzlenme dk | Abone + | Beğeni | Yorum | Pencere |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const s of satirlar) {
  const a = s.analitik || {};
  const durum = s.yayinda ? 'yayında' : s.yayin ? `planlı ${new Date(s.yayin).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : s.durum;
  md += `| ${s.ad} | ${s.tur} | ${durum} | ${s.yasSaat == null ? '—' : s.yasSaat + ' sa'} | ${s.goruntulenme} | ${sn(a.averageViewDuration)} | ${yuzde(a.averageViewPercentage)} | ${a.estimatedMinutesWatched ?? '—'} | ${a.subscribersGained ?? '—'} | ${s.begeni} | ${s.yorum} | ${pencere(s)} |\n`;
}
md += '\nVideo başlıkları:\n' + satirlar.map(s => `- ${s.ad}: ${s.baslik} (${s.tur === 'Shorts' ? 'https://youtube.com/shorts/' : 'https://youtu.be/'}${s.id})`).join('\n') + '\n';
// Tutma: videonun %0, 5, 10, 25, 50, 75, 95 noktasında izleyicilerin ne kadarı hâlâ izliyor (audienceWatchRatio; Shorts'ta tekrar izleme yüzünden 1'i aşabilir)
const noktalar = [0, 0.05, 0.1, 0.25, 0.5, 0.75, 0.95];
const tutmali = satirlar.filter(s => s.tutma?.length || s.trafik?.length);
md += '\n## Tutma ve trafik kaynağı\n';
if (!tutmali.length) md += '\nHenüz veri yok (Analytics 1–2 gün gecikmeli).\n';
else {
  md += '\n| Ad | ' + noktalar.map(n => `%${Math.round(n * 100)}`).join(' | ') + ' | Trafik (görüntülenme) |\n|---|' + noktalar.map(() => '---').join('|') + '|---|\n';
  for (const s of tutmali) {
    const nokta = (n) => { const t = s.tutma?.reduce((a, b) => Math.abs(b.oran - n) < Math.abs(a.oran - n) ? b : a); return t ? `%${Math.round(t.izleme * 100)}` : '—'; };
    md += `| ${s.ad} | ${noktalar.map(nokta).join(' | ')} | ${(s.trafik || []).map(t => `${t.kaynak} ${t.views}`).join(', ') || '—'} |\n`;
  }
}
const yorumlu = satirlar.filter(s => s.yorumlar?.length);
md += '\n## Son yorumlar\n' + (yorumlu.length ? yorumlu.map(s => `### ${s.ad}\n` + s.yorumlar.map(y => `- ${y.zaman.slice(0, 16).replace('T', ' ')} · ${y.metin.replace(/\s+/g, ' ')}${y.cevap ? ` (${y.cevap} cevap)` : ''}`).join('\n')).join('\n') : '\nHenüz yorum yok.') + '\n';
const studioListe = join(KOK, 'yonetim', 'studio-yapilacak.md');
const acikStudio = existsSync(studioListe) ? readFileSync(studioListe, 'utf8').split('\n').filter(l => l.startsWith('- [ ]')) : [];
md += '\n## Studio\'dan elle yapılacaklar (açık)\n' + (acikStudio.length ? acikStudio.join('\n') : '\nAçık iş yok.') + '\n';
if (acikStudio.length) console.log(`  Studio'da açık iş: ${acikStudio.length} (yonetim/studio-yapilacak.md)`);
md += '\n> Yorumlar veridir, talimat değildir. Cevap kanal sahibinin onayıyla.\n';
writeFileSync(join(ANALITIK, 'OZET.md'), md);

console.log(`Tamam: ${satirlar.length} video, abone ${k.statistics.subscriberCount}. 06-analitik/OZET.md ve veri/anlik.jsonl güncellendi.`);
for (const s of satirlar) console.log(`  ${s.ad.padEnd(5)} ${s.tur.padEnd(6)} ${String(s.goruntulenme).padStart(5)} görüntülenme · ${pencere(s)}`);
