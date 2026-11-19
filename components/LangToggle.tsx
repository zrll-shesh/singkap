'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LANG_COOKIE } from '@/lib/i18n';
import { useI18n } from './I18nProvider';

export default function LangToggle() {
  const { lang, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = lang === 'id' ? 'en' : 'id';

  return (
    <div className="bahasa" role="group" aria-label="Bahasa / Language">
      {(['id', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          disabled={pending}
          title={l === next ? t.nav.switchLabel : undefined}
          onClick={() => {
            if (l === lang) return;
            document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
            document.documentElement.lang = l;
            start(() => router.refresh());
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
