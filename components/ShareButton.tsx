'use client';

import { useState } from 'react';
import { useI18n } from './I18nProvider';

export default function ShareButton({ nama }: { nama: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    const text = t.detail.shareText(nama);
    try {
      if (navigator.share) {
        await navigator.share({ title: nama, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // pengguna membatalkan berbagi
    }
  }
  return (
    <button type="button" className="tombol tombol-garis" onClick={share} aria-live="polite">
      {copied ? t.detail.copied : t.detail.share}
    </button>
  );
}
