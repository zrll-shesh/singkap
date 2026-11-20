'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';
import { useSpeech } from './SpeechProvider';

function Speaker({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

export default function SuaraMenu() {
  const { t } = useI18n();
  const S = t.tts;
  const sp = useSpeech();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <div className="suara" ref={box} data-tts-abaikan>
        <button
          type="button"
          className="suara-tombol"
          aria-expanded={open}
          aria-controls="panel-suara"
          aria-label={S.button}
          title={S.button}
          data-aktif={sp.clickMode || sp.speaking}
          onClick={() => setOpen((v) => !v)}
        >
          <Speaker />
        </button>
        {open && (
          <div id="panel-suara" className="suara-panel" role="dialog" aria-label={S.title}>
            <strong>{S.title}</strong>
            {!sp.supported ? (
              <p className="catatan">{S.unsupported}</p>
            ) : (
              <>
                <button
                  type="button"
                  className="tombol tombol-utama tombol-kecil"
                  onClick={() => (sp.readingPage ? sp.stop() : sp.readPage())}
                >
                  {sp.readingPage ? S.stop : S.readPage}
                </button>
                <label className="sakelar suara-sakelar">
                  <input type="checkbox" checked={sp.clickMode} onChange={(e) => sp.setClickMode(e.target.checked)} />
                  {S.clickMode}
                </label>
                <p className="catatan">{S.clickHint}</p>
                <span className="label">{S.speed}</span>
                <div className="segmen suara-segmen" role="group" aria-label={S.speed}>
                  {[
                    [0.8, S.slow],
                    [1, S.normal],
                    [1.25, S.fast],
                  ].map(([v, l]) => (
                    <button key={String(v)} type="button" aria-pressed={sp.rate === v} onClick={() => sp.setRate(Number(v))}>
                      {l}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {sp.speaking && (
        <div className="suara-bar" role="status" data-tts-abaikan>
          <Speaker size={16} />
          <span>{S.speaking}</span>
          <button type="button" onClick={sp.stop}>
            {S.stop}
          </button>
        </div>
      )}
    </>
  );
}
