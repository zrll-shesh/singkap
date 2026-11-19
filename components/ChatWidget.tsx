'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ChatPanel from './ChatPanel';
import Logo from './Logo';
import { useI18n } from './I18nProvider';

export default function ChatWidget() {
  const path = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (path.startsWith('/tanya')) return null;
  return (
    <>
      {open && (
        <section className="jendela-obrolan" aria-label={t.tanya.launcher}>
          <div className="jendela-kepala">
            <strong>{t.tanya.launcher}</strong>
            <button onClick={() => setOpen(false)} aria-label={t.tanya.closeChat}>
              ×
            </button>
          </div>
          <ChatPanel />
        </section>
      )}
      <button className="peluncur" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? t.nav.close : t.tanya.launcher}>
        <Logo size={22} />
        <span className="teks-peluncur">{open ? t.nav.close : t.tanya.launcher}</span>
      </button>
    </>
  );
}
