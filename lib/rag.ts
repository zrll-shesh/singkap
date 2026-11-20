import 'server-only';
import kbRaw from '@/data/kb.json';
import intentsRaw from '@/data/intents.json';
import type { ChatReply, Sumber } from './types';

interface Chunk {
  id: string;
  doc: string;
  jenis: string;
  judul: string;
  teks: string;
  provinsi: string | null;
  sumber: Sumber[];
}

interface IntentDef {
  intent: string;
  pola: string[];
  maks_kata: number;
  jawaban: string[];
}

interface IntentFile {
  intents: IntentDef[];
  quick_replies: string[];
  pola_aksi_rekomendasi: string;
  pola_sapaan_awal: string;
  pola_topik: string;
}

const KB = kbRaw as unknown as Chunk[];
const INTENTS = intentsRaw as unknown as IntentFile;
const INTENT_RE = INTENTS.intents.map((it) => ({ ...it, re: it.pola.map((p) => new RegExp(p)) }));
const GREETING_RE = new RegExp(INTENTS.pola_sapaan_awal);
const ACTION_RE = new RegExp(INTENTS.pola_aksi_rekomendasi);
const TOPIC_RE = new RegExp(
  INTENTS.pola_topik.replace(/\)\\b$/, '|indeks|ketakterlihatan|visibilitas|kekayaan|kepekaan|jalur|peta|dasbor|pemerataan|lambda|rumah adat)\\b'),
);
export const QUICK_REPLIES = INTENTS.quick_replies;
export const QUICK_REPLIES_EN = [
  'What is the Digital Invisibility Index?',
  'Hidden heritage in East Java',
  'Which province is the most hidden?',
  'Recommend a cultural trip',
];

const INTENT_EN: Record<string, string> = {
  salam_islam: 'Wa alaikum salam. I am SINGKAP, here to help you explore Indonesia’s cultural heritage. Where would you like to start?',
  sapaan: 'Hello! I am SINGKAP, an assistant for discovering Indonesian heritage that few people know about. Ask about a heritage item, a province, or how the index works.',
  salam_waktu: 'Welcome to SINGKAP! Which heritage would you like to uncover today?',
  terima_kasih: 'You are welcome! Ask me anytime about other heritage you would like to know.',
  pamit: 'Goodbye, and enjoy your cultural journey!',
  identitas: 'I am SINGKAP, the assistant of a platform that measures and reveals Indonesian intangible heritage that is officially recognised but rarely seen. I always show my sources.',
  kemampuan: 'I can explain Indonesian intangible heritage with sources, show the most hidden provinces and items, suggest cultural trips through SINGKAP routes, and explain features like house recognition and the Cultural Sensitivity Guard.',
  pujian: 'Thank you! There is still so much heritage waiting to be revealed. Shall we keep exploring?',
};
const EN_GREETING = /^(hello|hi|hey|good\s+(morning|afternoon|evening))\b/;
const EN_THANKS = /\b(thanks|thank\s+you|thx)\b/;
const EN_IDENTITY = /\b(who\s+are\s+you|what\s+is\s+singkap|what\s+can\s+you\s+do)\b/;

export function intentReply(intent: string, lang: 'id' | 'en', fallback: string): string {
  return lang === 'en' ? INTENT_EN[intent] ?? fallback : fallback;
}

export function englishSmallTalk(t: string): string | null {
  const words = t.split(' ').length;
  if (words <= 4 && EN_GREETING.test(t)) return 'sapaan';
  if (words <= 5 && EN_THANKS.test(t)) return 'terima_kasih';
  if (words <= 7 && EN_IDENTITY.test(t)) return /can you do/.test(t) ? 'kemampuan' : 'identitas';
  return null;
}

const STOP = new Set(
  ('yang dan di ke dari ini itu untuk dengan pada adalah sebagai dalam tidak akan juga atau ada oleh karena saya kamu anda apa ' +
    'apakah bagaimana gimana berapa siapa mana kapan mengapa kenapa tentang ceritakan jelaskan tolong dong ya kak min saja aja sih ' +
    'nih yg bisa mau ingin para sang si se nya sudah belum masih telah hal kah lah pun the of a an is are to in and what how ' +
    'beri berikan sebutkan coba boleh minta info informasi tahu kasih')
    .split(' '),
);

export function normChat(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function plain(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return plain(s)
    .split(' ')
    .map((t) => (t.length > 5 && t.endsWith('nya') ? t.slice(0, -3) : t))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// Indeks BM25 dibangun sekali saat fungsi pertama kali dijalankan
const K1 = 1.4;
const B = 0.75;
const docTf: Map<string, number>[] = [];
const docLen: number[] = [];
const df = new Map<string, number>();
const titleNorm: string[] = [];
for (const c of KB) {
  const toks = [...tokens(c.judul), ...tokens(c.judul), ...tokens(c.teks)];
  const tf = new Map<string, number>();
  for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
  for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  docTf.push(tf);
  docLen.push(toks.length);
  titleNorm.push(plain(c.judul));
}
const N = KB.length;
const AVGDL = docLen.reduce((a, b) => a + b, 0) / N;
const PROVINCES = [...new Set(KB.map((c) => c.provinsi).filter((p): p is string => Boolean(p)))];

export interface Hit {
  chunk: Chunk;
  score: number;
  coverage: number;
  exact: boolean;
}

const EXPAND: Record<string, string> = {
  ikd: 'indeks ketakterlihatan digital ikd',
  skor: 'indeks ketakterlihatan digital ikd skor',
  score: 'indeks ketakterlihatan digital ikd',
  invisibility: 'ketakterlihatan indeks',
  index: 'indeks',
  hidden: 'tersembunyi',
  province: 'provinsi',
  heritage: 'warisan',
  dance: 'tari',
  house: 'rumah',
  ceremony: 'upacara',
  ceremonies: 'upacara adat',
  recommend: 'rekomendasi',
  trip: 'wisata',
  east: 'timur',
  west: 'barat',
  north: 'utara',
  south: 'selatan',
  central: 'tengah',
  java: 'jawa',
  sumatra: 'sumatera',
  wbtbi: 'warisan budaya takbenda indonesia wbtbi',
  wbtb: 'warisan budaya takbenda wbtb',
  jalur: 'jalur singkap rekomendasi',
};

function expand(q: string): string {
  return plain(q)
    .split(' ')
    .map((t) => EXPAND[t] ?? t)
    .join(' ');
}

export function retrieve(query: string, k = 6): Hit[] {
  const q = [...new Set(tokens(expand(query)))];
  const qPlain = ` ${plain(query)} `;
  const prov = PROVINCES.find((p) => qPlain.includes(` ${plain(p)} `));
  const wantsHidden = /\b(tersembunyi|ikd tertinggi|paling tidak terlihat)\b/.test(qPlain);
  if (!q.length) return [];
  const scores: Hit[] = [];
  for (let i = 0; i < N; i++) {
    const tf = docTf[i];
    let s = 0;
    let matched = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      matched++;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * docLen[i]) / AVGDL)));
    }
    if (!matched) continue;
    const title = titleNorm[i];
    const exact = title.length >= 3 && qPlain.includes(` ${title} `);
    if (exact) s += 6;
    if (prov && KB[i].provinsi === prov) s *= KB[i].jenis === 'profil_provinsi' ? 1.9 : 1.15;
    if (!prov && wantsHidden && (KB[i].jenis === 'temuan' || KB[i].jenis === 'daftar_tersembunyi')) s *= 1.6;
    const coverage = matched / q.length;
    scores.push({ chunk: KB[i], score: s * (0.5 + 0.5 * coverage), coverage, exact });
  }
  scores.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: Hit[] = [];
  for (const h of scores) {
    if (seen.has(h.chunk.doc)) continue;
    seen.add(h.chunk.doc);
    out.push(h);
    if (out.length === k) break;
  }
  return out;
}

export type Route =
  | { jenis: 'intent'; intent: string; jawaban: string }
  | { jenis: 'tidak_tahu'; aksi: string | null }
  | { jenis: 'rag'; hits: Hit[]; sapa: boolean; aksi: string | null; query: string; strong: boolean };

export const MIN_SCORE = 5;
export const MIN_COVERAGE = 0.75;

export function route(message: string, previous?: string): Route {
  const t = normChat(message);
  const words = t ? t.split(' ').length : 0;
  const en = englishSmallTalk(t);
  if (en) return { jenis: 'intent', intent: en, jawaban: INTENT_RE.find((i) => i.intent === en)?.jawaban[0] ?? '' };
  for (const it of INTENT_RE) {
    if (words <= it.maks_kata && it.re.some((r) => r.test(t))) {
      return { jenis: 'intent', intent: it.intent, jawaban: it.jawaban[Math.floor(Math.random() * it.jawaban.length)] };
    }
  }
  const sapa = GREETING_RE.test(t);
  let query = t.replace(GREETING_RE, '').trim() || t;
  if (previous && tokens(query).length <= 2) query = `${normChat(previous)} ${query}`;
  const aksi = ACTION_RE.test(t) ? 'buka_jalur_singkap' : null;
  const hits = retrieve(query);
  const onTopic = TOPIC_RE.test(plain(query));
  const strong = hits.length > 0 && (hits[0].exact || (hits[0].score >= MIN_SCORE && hits[0].coverage >= MIN_COVERAGE));
  if (!strong && !onTopic) return { jenis: 'tidak_tahu', aksi };
  if (!hits.length) return { jenis: 'tidak_tahu', aksi };
  return { jenis: 'rag', hits, sapa, aksi, query, strong };
}

export const SYSTEM_PROMPT = `Kamu adalah Singkap, asisten platform SINGKAP (Sistem Inteligensi Nusantara Guna Kebangkitan Aset Pusaka).
Tugasmu membantu orang mengenal Warisan Budaya Takbenda Indonesia, terutama yang belum banyak dikenal, dan menjelaskan cara kerja SINGKAP.

Glosarium yang wajib dipakai apa adanya:
- IKD adalah Indeks Ketakterlihatan Digital, di antarmuka disebut skor tersembunyi. IKD = K x (1 - V) x (1 - A). Makin tinggi, makin tersembunyi. Untuk pengguna umum, jelaskan dengan bahasa sehari-hari.
- K adalah kekayaan budaya provinsi, V adalah visibilitas digital warisan, A adalah arus wisata provinsi.
- WBTb adalah Warisan Budaya Takbenda. WBTbI adalah Warisan Budaya Takbenda Indonesia yang ditetapkan pemerintah pusat.
- Jalur Singkap adalah fitur rekomendasi wisata berkeadilan. Peta Singkap adalah peta IKD. Kenali Rumah Adat mengenali rumah adat dari foto.

Aturan:
1. Jawab hanya berdasarkan KONTEKS. Cantumkan nomor sumber dalam kurung siku, misalnya [1] atau [2], tepat setelah fakta yang dipakai.
2. Bila KONTEKS tidak memuat jawabannya, katakan dengan jujur bahwa kamu belum punya informasi itu, lalu tawarkan topik terkait yang ada di KONTEKS. Jangan mengarang fakta, angka, sejarah, atau kepanjangan singkatan.
3. Buka jawaban dengan sapaan singkat hanya jika PENGGUNA_MENYAPA bernilai ya. Selain itu langsung jawab.
4. Warisan berstatus "perlu persetujuan" tidak boleh disarankan sebagai objek wisata. Jelaskan bahwa warisan itu memerlukan persetujuan komunitas atau pemerintah daerah.
5. Saat diminta rekomendasi wisata, utamakan warisan yang terbuka dengan IKD tinggi dan sarankan membuka Jalur Singkap.
6. Format teks biasa: paragraf pendek, boleh daftar dengan tanda "-" dan huruf tebal dengan **. Jangan memakai LaTeX, tabel, atau judul.
7. Jawab dalam BAHASA_JAWABAN yang diminta. Bila bahasa Inggris, terjemahkan istilah dengan wajar, misalnya IKD menjadi Digital Invisibility Index, tetapi biarkan nama warisan dan nama provinsi apa adanya.
8. Ringkas, hangat, dan manusiawi, paling banyak sekitar 150 kata kecuali pengguna meminta rinci.`;

export function buildContext(hits: Hit[]): string {
  return hits
    .map((h, i) => `[${i + 1}] ${h.chunk.judul}: ${h.chunk.teks}`)
    .join('\n');
}

export function sourcesOf(hits: Hit[]): Sumber[] {
  return hits.map((h, i) => {
    const s = h.chunk.sumber[h.chunk.sumber.length - 1];
    return { nama: `[${i + 1}] ${h.chunk.judul}`, url: s?.url ?? '', lisensi: s?.lisensi ?? '' };
  });
}

export function extractiveAnswer(hits: Hit[]): string {
  const top = hits.slice(0, 2);
  const parts = top.map((h, i) => {
    const sentences = h.chunk.teks.split(/(?<=\.)\s+/).slice(0, 3).join(' ');
    return `${sentences} [${i + 1}]`;
  });
  return parts.join('\n\n');
}

interface GeminiTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function callGemini(contents: GeminiTurn[]): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error('Gemini error', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim();
    return text || null;
  } catch (e) {
    console.error('Gemini gagal', e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type { ChatReply };
