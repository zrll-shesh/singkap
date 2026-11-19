import type { DomainCode } from './types';

export const DOMAIN_LABEL: Record<DomainCode, string> = {
  ADAT_RITUS: 'Adat istiadat, ritus, dan perayaan',
  KERAJINAN: 'Kemahiran dan kerajinan tradisional',
  PENGETAHUAN_ALAM: 'Pengetahuan tentang alam dan semesta',
  PERTUNJUKAN: 'Seni pertunjukan',
  LISAN: 'Tradisi dan ekspresi lisan',
};

export const DOMAIN_SHORT: Record<DomainCode, string> = {
  ADAT_RITUS: 'Adat dan ritus',
  KERAJINAN: 'Kerajinan',
  PENGETAHUAN_ALAM: 'Pengetahuan alam',
  PERTUNJUKAN: 'Seni pertunjukan',
  LISAN: 'Tradisi lisan',
};

export const UNSUR: Record<DomainCode, string[]> = {
  LISAN: ['Bahasa', 'Kesenian'],
  PERTUNJUKAN: ['Kesenian'],
  ADAT_RITUS: ['Sistem religi', 'Organisasi sosial'],
  PENGETAHUAN_ALAM: ['Sistem pengetahuan', 'Sistem mata pencaharian'],
  KERAJINAN: ['Sistem peralatan hidup dan teknologi', 'Sistem mata pencaharian'],
};

export const V_LABELS = [
  'Artikel bahasa Indonesia',
  'Artikel bahasa Inggris',
  'Butir Wikidata',
  'Gambar utama',
  'Kunjungan halaman',
  'Panjang artikel',
];

const nf = new Intl.NumberFormat('id-ID');

export function num(x: number): string {
  return nf.format(Math.round(x));
}

export function pct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits).replace('.', ',')}%`;
}

export function dec(x: number, digits = 2): string {
  return x.toFixed(digits).replace('.', ',');
}

export function compact(x: number): string {
  if (x >= 1e6) return `${(x / 1e6).toFixed(1).replace('.', ',')} juta`;
  if (x >= 1e3) return `${(x / 1e3).toFixed(1).replace('.', ',')} ribu`;
  return num(x);
}

export function normText(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function wikiUrl(title: string, lang = 'id'): string {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}
