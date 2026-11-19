'use client';

import { createContext, useContext, useMemo } from 'react';
import { DICTS, makeFmt, type Dict, type Fmt, type Lang } from '@/lib/i18n';

interface Ctx {
  lang: Lang;
  t: Dict;
  f: Fmt;
}

const I18nContext = createContext<Ctx>({ lang: 'id', t: DICTS.id, f: makeFmt('id') });

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: DICTS[lang], f: makeFmt(lang) }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  return useContext(I18nContext);
}
