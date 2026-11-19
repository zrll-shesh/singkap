import 'server-only';
import { cookies, headers } from 'next/headers';
import { DICTS, LANG_COOKIE, makeFmt, type Lang } from './i18n';

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (c === 'en' || c === 'id') return c;
  const accept = (await headers()).get('accept-language') ?? '';
  return /^en\b/i.test(accept) && !/\bid\b/i.test(accept.split(',')[0]) ? 'en' : 'id';
}

export async function getI18n() {
  const lang = await getLang();
  return { lang, t: DICTS[lang], f: makeFmt(lang) };
}
