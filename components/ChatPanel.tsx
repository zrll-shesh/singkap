'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import RichText from './RichText';
import { useI18n } from './I18nProvider';
import type { ChatReply, Sumber } from '@/lib/types';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  sumber?: Sumber[];
  aksi?: string | null;
  intro?: boolean;
}

export default function ChatPanel({ initial }: { initial?: string }) {
  const { t, lang } = useI18n();
  const T = t.tanya;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'assistant', text: T.greeting, intro: true }]);
  const [saran, setSaran] = useState<string[]>(T.suggestions);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    setMsgs((m) => (m.length === 1 && m[0].intro ? [{ role: 'assistant', text: T.greeting, intro: true }] : m));
    setSaran((s) => (s.length ? T.suggestions : s));
  }, [T]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', text: q }];
    setMsgs(next);
    setInput('');
    setSaran([]);
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, messages: next.filter((m) => !m.intro).map(({ role, text }) => ({ role, text })) }),
      });
      const data: ChatReply = await res.json();
      setMsgs((m) => [...m, { role: 'assistant', text: data.jawaban, sumber: data.sumber, aksi: data.aksi }]);
      setSaran(data.saran ?? []);
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', text: T.offline }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initial && !sentInitial.current) {
      sentInitial.current = true;
      send(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <div className="obrolan">
      <div className="obrolan-isi" ref={listRef} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`pesan ${m.role === 'user' ? 'pesan-pengguna' : 'pesan-singkap'}`}>
            {m.role === 'user' ? m.text : <RichText text={m.text} />}
            {m.aksi === 'buka_jalur_singkap' && (
              <p style={{ marginTop: 10 }}>
                <Link className="tombol tombol-utama tombol-kecil" href="/jalur">
                  {T.openJalur}
                </Link>
              </p>
            )}
            {m.sumber && m.sumber.length > 0 && (
              <div className="pesan-sumber">
                {T.sources}
                <ol>
                  {m.sumber.map((s, j) => (
                    <li key={j}>
                      {s.url.startsWith('http') ? (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.nama}
                        </a>
                      ) : (
                        s.nama
                      )}
                      {s.lisensi ? ` (${s.lisensi})` : ''}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="pesan pesan-singkap" aria-label={T.typing}>
            <span className="mengetik">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
      </div>
      {saran.length > 0 && (
        <div className="saran">
          {saran.map((s) => (
            <button key={s} className="keping" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="obrolan-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="tanya-input" className="sr-only">
          {T.inputLabel}
        </label>
        <textarea
          id="tanya-input"
          rows={1}
          value={input}
          maxLength={600}
          placeholder={T.placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <button className="tombol tombol-utama" disabled={busy || !input.trim()}>
          {T.send}
        </button>
      </form>
    </div>
  );
}
