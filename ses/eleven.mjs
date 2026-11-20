// ElevenLabs ortak modülü: zaman damgalı TTS, ses ayarı, abonelik/kredi ölçümü, harcama günlüğü.
// uyarlandı (kaynak: kaynak-eleven.mjs). Farklar: kök bu proje; harcama `ses/harcama.jsonl`; varsayılan model
// `eleven_v4_turbo`; ses ayarı VERİLMEZSE sesin kendi varsayılanları (`GET /v1/voices/<id>/settings`) aynen gönderilir;
// `speed` hiç gönderilmez.
// Anahtar yalnız .env › ELEVENLABS_API_KEY'den okunur; hiçbir çıktıya, loga ya da hata mesajına yazılmaz.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function loadEnv() {
  const f = path.join(ROOT, '.env'); const out = {};
  if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const ENV = loadEnv();
export const API = 'https://api.elevenlabs.io';
const KEY = () => (ENV.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || '').trim();
export const anahtarVar = () => KEY().length > 0;
export const HARCAMA = path.join(ROOT, 'ses', 'harcama.jsonl');
export const MODEL = KANAL.ses?.model || 'eleven_v4_turbo';
import { KANAL } from '../ayar.mjs';
export const SES_KIMLIGI = KANAL.ses?.kimlik || '';   // kanal.json › ses.kimlik (ElevenLabs ses kimliği)

export async function el(method, p, { query = null, body = null } = {}) {
  if (!anahtarVar()) throw new Error('ELEVENLABS_API_KEY boş (.env).');
  const url = new URL(API + p);
  if (query) for (const [k, v] of Object.entries(query)) if (v != null) url.searchParams.set(k, String(v));
  const r = await fetch(url, { method, headers: { 'xi-api-key': KEY(), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text();
  if (!r.ok) { let d = ''; try { d = JSON.parse(txt).detail; d = typeof d === 'string' ? d : d?.message || d?.status || ''; } catch { /* */ } throw new Error(`ElevenLabs ${method} ${p} → ${r.status}${d ? ': ' + String(d).slice(0, 200) : ''}`); }
  try { return { json: JSON.parse(txt), istekId: r.headers.get('request-id') || r.headers.get('x-request-id') || null }; } catch { return { json: null, ham: txt }; }
}

export async function abonelik() {
  const { json } = await el('GET', '/v1/user/subscription');
  return { kullanilan: json.character_count, limit: json.character_limit, kalan: json.character_limit - json.character_count, tier: json.tier, sifirlanma: json.next_character_count_reset_unix };
}
export async function sesAyari(sesId) {
  const { json } = await el('GET', `/v1/voices/${encodeURIComponent(sesId)}/settings`);
  const { speed, ...ayar } = json || {};   // speed gönderilmez
  return ayar;
}

export function harcamaYaz(kayit) {
  fs.mkdirSync(path.dirname(HARCAMA), { recursive: true });
  fs.appendFileSync(HARCAMA, JSON.stringify({ t: new Date().toISOString(), ...kayit }) + '\n');
}

// alignment (karakter zamanları) → kelimeler [{ w, t0, t1 }]; boşluk kelime ayırır, noktalama kelimeye yapışık kalır
export function kelimelereAyir(al) {
  const ch = al?.characters || [], s = al?.character_start_times_seconds || [], e = al?.character_end_times_seconds || [];
  const out = []; let w = '', t0 = null, t1 = null;
  for (let i = 0; i < ch.length; i++) {
    if (/\s/.test(ch[i])) { if (w) out.push({ w, t0: +t0.toFixed(3), t1: +t1.toFixed(3) }); w = ''; t0 = null; continue; }
    if (t0 == null) t0 = s[i]; t1 = e[i]; w += ch[i];
  }
  if (w) out.push({ w, t0: +t0.toFixed(3), t1: +t1.toFixed(3) });
  return out;
}

// Zaman damgalı TTS: mp3 + ham hizalama yazar, kelimeleri döndürür, harcamayı loglar (abonelik farkıyla ölçülen kredi)
export async function tts({ sesId = SES_KIMLIGI, metin, model = MODEL, ayar, seed = 42, cikti, is = 'tts', not = null }) {
  let once = null; try { once = await abonelik(); } catch { /* ölçüm opsiyonel */ }
  const body = { text: metin, model_id: model, seed };
  if (ayar) body.voice_settings = ayar;
  const { json, istekId } = await el('POST', `/v1/text-to-speech/${encodeURIComponent(sesId)}/with-timestamps`, { query: { output_format: 'mp3_44100_128' }, body });
  fs.mkdirSync(path.dirname(cikti), { recursive: true });
  fs.writeFileSync(cikti, Buffer.from(json.audio_base64, 'base64'));
  const al = json.alignment || json.normalized_alignment;
  fs.writeFileSync(cikti.replace(/\.mp3$/, '.hizalama.json'), JSON.stringify({ alignment: json.alignment, normalized_alignment: json.normalized_alignment }));
  let sonra = null; try { await new Promise((r) => setTimeout(r, 1500)); sonra = await abonelik(); } catch { /* */ }
  const kelimeler = kelimelereAyir(al);
  harcamaYaz({ is, ses: sesId, model, karakter: metin.length, kredi_olculen: once && sonra ? sonra.kullanilan - once.kullanilan : null, kalan: sonra?.kalan ?? null, istek: istekId, dosya: path.relative(ROOT, cikti).split(path.sep).join('/'), not });
  return { kelimeler, sure: kelimeler.length ? kelimeler[kelimeler.length - 1].t1 : null, kalan: sonra?.kalan ?? null, kredi: once && sonra ? sonra.kullanilan - once.kullanilan : null };
}

// multipart istek (konuşmadan metne: dosya yükleme). Hata mesajında anahtar yazılmaz.
export async function elForm(p, alanlar, { query = null } = {}) {
  if (!anahtarVar()) throw new Error('ELEVENLABS_API_KEY boş (.env).');
  const url = new URL(API + p);
  if (query) for (const [k, v] of Object.entries(query)) if (v != null) url.searchParams.set(k, String(v));
  const fd = new FormData();
  for (const [k, v] of Object.entries(alanlar)) if (v instanceof Blob) fd.append(k, v, v.name || 'ses.mp3'); else if (v != null) fd.append(k, String(v));
  const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': KEY() }, body: fd });
  const txt = await r.text();
  if (!r.ok) { let d = ''; try { d = JSON.parse(txt).detail; d = typeof d === 'string' ? d : d?.message || d?.status || ''; } catch { /* */ } throw new Error(`ElevenLabs POST ${p} → ${r.status}${d ? ': ' + String(d).slice(0, 160) : ''}`); }
  return { json: JSON.parse(txt), istekId: r.headers.get('request-id') || r.headers.get('x-request-id') || null };
}
