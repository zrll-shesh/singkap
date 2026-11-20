'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { speakText, speechSupported, stopSpeech } from '@/lib/speech';
import { useI18n } from './I18nProvider';

interface SpeechCtx {
  supported: boolean;
  clickMode: boolean;
  setClickMode: (v: boolean) => void;
  rate: number;
  setRate: (v: number) => void;
  speaking: boolean;
  readingPage: boolean;
  say: (text: string, el?: Element | null) => void;
  readPage: () => void;
  stop: () => void;
}

const Ctx = createContext<SpeechCtx | null>(null);
const STORE = 'singkap_suara';
const READABLE = 'h1, h2, h3, h4, p, li, figcaption, th, td, label, .grafik-judul, .baris, .hasil-kartu h3, .status, .keping, .tombol, a, button, [aria-label]';
const PAGE_ITEMS = 'h1, h2, h3, p, li, figcaption, .grafik-judul, th, td';

function textOf(el: Element): string {
  if (el instanceof HTMLCanvasElement || el.tagName.toLowerCase() === 'svg') return el.getAttribute('aria-label') ?? '';
  const own = (el as HTMLElement).innerText?.trim();
  return own || el.getAttribute('aria-label') || el.getAttribute('title') || '';
}

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const [supported, setSupported] = useState(false);
  const [clickMode, setClickModeState] = useState(false);
  const [rate, setRateState] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [readingPage, setReadingPage] = useState(false);
  const highlighted = useRef<Element | null>(null);
  const armed = useRef<Element | null>(null);
  const queue = useRef<Element[]>([]);

  useEffect(() => {
    setSupported(speechSupported());
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? '{}');
      if (typeof saved.clickMode === 'boolean') setClickModeState(saved.clickMode);
      if (typeof saved.rate === 'number') setRateState(saved.rate);
    } catch {
      // pengaturan tersimpan tidak terbaca; pakai nilai bawaan
    }
    if (speechSupported()) window.speechSynthesis.getVoices();
  }, []);

  const persist = (next: { clickMode?: boolean; rate?: number }) => {
    try {
      const cur = JSON.parse(localStorage.getItem(STORE) ?? '{}');
      localStorage.setItem(STORE, JSON.stringify({ ...cur, ...next }));
    } catch {
      // penyimpanan tidak tersedia
    }
  };

  const unmark = () => {
    highlighted.current?.classList.remove('tts-sorot');
    highlighted.current = null;
  };

  const mark = (el?: Element | null) => {
    unmark();
    if (el) {
      el.classList.add('tts-sorot');
      highlighted.current = el;
    }
  };

  const stop = useCallback(() => {
    queue.current = [];
    stopSpeech();
    unmark();
    setSpeaking(false);
    setReadingPage(false);
  }, []);

  const say = useCallback(
    (text: string, el?: Element | null) => {
      if (!speechSupported() || !text.trim()) return;
      queue.current = [];
      setReadingPage(false);
      mark(el);
      setSpeaking(true);
      speakText(text, lang, rate, () => {
        unmark();
        setSpeaking(false);
      });
    },
    [lang, rate],
  );

  const next = useCallback(() => {
    const el = queue.current.shift();
    if (!el) {
      unmark();
      setSpeaking(false);
      setReadingPage(false);
      return;
    }
    mark(el);
    el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    speakText(textOf(el), lang, rate, () => next());
  }, [lang, rate]);

  const readPage = useCallback(() => {
    const root = document.getElementById('konten');
    if (!root || !speechSupported()) return;
    const all = Array.from(root.querySelectorAll(PAGE_ITEMS)).filter(
      (el) => (el as HTMLElement).offsetParent !== null && textOf(el).length > 1,
    );
    const set = new Set(all);
    queue.current = all.filter((el) => {
      let p = el.parentElement;
      while (p && p !== root) {
        if (set.has(p)) return false;
        p = p.parentElement;
      }
      return true;
    });
    stopSpeech();
    setReadingPage(true);
    setSpeaking(true);
    next();
  }, [next]);

  // Mode klik untuk dibacakan: ketuk sekali untuk mendengar, ketuk lagi untuk membuka tautan atau menekan tombol
  useEffect(() => {
    document.body.classList.toggle('mode-baca', clickMode);
    if (!clickMode) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target.closest('[data-tts-abaikan]')) return;
      if (target.closest('input, textarea, select')) return;
      const el = target.closest(READABLE);
      if (!el) return;
      const interactive = el.closest('a, button');
      const text = textOf(interactive ?? el);
      if (!text) return;
      if (interactive) {
        if (armed.current === interactive) {
          armed.current = null;
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        armed.current = interactive;
        say(text, interactive);
        return;
      }
      armed.current = null;
      say(text, el);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [clickMode, say]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stop]);

  useEffect(() => stop, [lang, stop]);

  const value = useMemo<SpeechCtx>(
    () => ({
      supported,
      clickMode,
      setClickMode: (v) => {
        setClickModeState(v);
        persist({ clickMode: v });
        if (!v) stop();
      },
      rate,
      setRate: (v) => {
        setRateState(v);
        persist({ rate: v });
      },
      speaking,
      readingPage,
      say,
      readPage,
      stop,
    }),
    [supported, clickMode, rate, speaking, readingPage, say, readPage, stop],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSpeech(): SpeechCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSpeech harus dipakai di dalam SpeechProvider');
  return ctx;
}
