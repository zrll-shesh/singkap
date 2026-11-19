import { NextResponse } from 'next/server';
import { QUICK_REPLIES, QUICK_REPLIES_EN, buildContext, callGemini, extractiveAnswer, intentReply, route, sourcesOf } from '@/lib/rag';
import type { ChatReply } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface InMessage {
  role: 'user' | 'assistant';
  text: string;
}

const WINDOW_MS = 60_000;
const MAX_REQ = 20;
const requests = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (requests.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  requests.set(ip, list);
  return list.length > MAX_REQ;
}

const UNKNOWN = {
  id:
    'Maaf, saya belum punya informasi untuk menjawab itu. Saya fokus pada warisan budaya takbenda Indonesia dan cara kerja SINGKAP. ' +
    'Coba tanyakan tentang suatu warisan, warisan tersembunyi di sebuah provinsi, atau arti Indeks Ketakterlihatan Digital.',
  en:
    'Sorry, I do not have information to answer that yet. I focus on Indonesian intangible cultural heritage and how SINGKAP works. ' +
    'Try asking about a heritage item, hidden heritage in a province, or what the Digital Invisibility Index means.',
};
const MESSAGES = {
  id: {
    limit: 'Terlalu banyak pertanyaan dalam satu menit. Tunggu sebentar lalu coba lagi.',
    bad: 'Format permintaan tidak valid.',
    empty: 'Silakan ketik pertanyaanmu tentang warisan budaya Nusantara.',
    extractive: 'Berikut informasi paling relevan dari pengetahuan SINGKAP:',
  },
  en: {
    limit: 'Too many questions in one minute. Please wait a moment and try again.',
    bad: 'Invalid request format.',
    empty: 'Type your question about Indonesian cultural heritage.',
    extractive: 'Here is the most relevant information from SINGKAP’s knowledge base (in Indonesian):',
  },
};

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'lokal';
  if (rateLimited(ip)) {
    return NextResponse.json<ChatReply>({ jenis: 'galat', jawaban: `${MESSAGES.id.limit} ${MESSAGES.en.limit}` }, { status: 429 });
  }

  let messages: InMessage[] = [];
  let lang: 'id' | 'en' = 'id';
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
    lang = body?.lang === 'en' ? 'en' : 'id';
  } catch {
    return NextResponse.json<ChatReply>({ jenis: 'galat', jawaban: MESSAGES.id.bad }, { status: 400 });
  }
  const M = MESSAGES[lang];
  const QR = lang === 'en' ? QUICK_REPLIES_EN : QUICK_REPLIES;
  const clean = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .map((m) => ({ role: m.role, text: m.text.slice(0, 600) }))
    .slice(-8);
  const userMsgs = clean.filter((m) => m.role === 'user');
  const last = userMsgs[userMsgs.length - 1]?.text?.trim();
  if (!last) {
    return NextResponse.json<ChatReply>({ jenis: 'intent', jawaban: M.empty, saran: QR });
  }

  const r = route(last, userMsgs[userMsgs.length - 2]?.text);
  if (r.jenis === 'intent') {
    return NextResponse.json<ChatReply>({ jenis: 'intent', jawaban: intentReply(r.intent, lang, r.jawaban), saran: QR });
  }
  if (r.jenis === 'tidak_tahu') {
    return NextResponse.json<ChatReply>({ jenis: 'tidak_tahu', jawaban: UNKNOWN[lang], saran: QR, aksi: r.aksi });
  }

  const history = clean.slice(0, -1).slice(-4).map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: m.text }],
  }));
  while (history.length && history[0].role !== 'user') history.shift();
  const prompt =
    `KONTEKS:\n${buildContext(r.hits)}\n\n` +
    `PENGGUNA_MENYAPA: ${r.sapa ? 'ya' : 'tidak'}\n` +
    `BAHASA_JAWABAN: ${lang === 'en' ? 'English' : 'Bahasa Indonesia'}\n` +
    `PERTANYAAN PENGGUNA: ${last}`;
  const llm = await callGemini([...history, { role: 'user', parts: [{ text: prompt }] }]);
  if (!llm && !r.strong) {
    return NextResponse.json<ChatReply>({ jenis: 'tidak_tahu', jawaban: UNKNOWN[lang], saran: QR, aksi: r.aksi });
  }
  const jawaban = llm ?? `${M.extractive}\n\n${extractiveAnswer(r.hits)}`;
  return NextResponse.json<ChatReply>({ jenis: 'rag', jawaban, sumber: sourcesOf(r.hits), aksi: r.aksi });
}
