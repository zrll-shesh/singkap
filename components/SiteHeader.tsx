'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import LangToggle from './LangToggle';
import { useI18n } from './I18nProvider';

export default function SiteHeader() {
  const path = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const links = [
    { href: '/peta', label: t.nav.peta },
    { href: '/jalur', label: t.nav.jalur },
    { href: '/jelajah', label: t.nav.jelajah },
    { href: '/kenali', label: t.nav.kenali },
    { href: '/tanya', label: t.nav.tanya },
    { href: '/dasbor', label: t.nav.dasbor },
    { href: '/metodologi', label: t.nav.metodologi },
  ];

  return (
    <header className="kepala">
      <a className="lompat" href="#konten">
        {t.nav.skip}
      </a>
      <div className="wadah kepala-isi">
        <Link href="/" className="merek" aria-label={t.nav.home}>
          <Logo size={34} />
          SINGKAP
        </Link>
        <nav id="navigasi-utama" className="navigasi" data-buka={open} aria-label="Navigasi">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <LangToggle />
        <button className="tombol-menu" aria-expanded={open} aria-controls="navigasi-utama" onClick={() => setOpen((v) => !v)}>
          {open ? t.nav.close : t.nav.menu}
        </button>
      </div>
    </header>
  );
}
