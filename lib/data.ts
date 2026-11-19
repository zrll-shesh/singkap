import 'server-only';
import warisanRaw from '@/data/warisan.json';
import provinsiRaw from '@/data/provinsi.json';
import ringkasanRaw from '@/data/ringkasan.json';
import manifestRaw from '@/data/manifest.json';
import type { Provinsi, WarisanFull } from './types';

export interface Insight {
  id: string;
  judul: string;
  teks: string;
}

export interface EvalRow {
  lambda: number;
  ndcg10: number;
  gini: number;
  ikd_rata2: number;
  porsi_5_terlihat: number;
  provinsi_terjangkau: number;
}

export interface Ringkasan {
  n: number;
  nResmi: number;
  tanpaArtikel: number;
  tanpaEn: number;
  gini: number;
  top10: number;
  medianPv: number;
  perluPersetujuan: number;
  nMuseum: number;
  nSitus: number;
  top5: string[];
  kayaTersembunyi: string[];
  baliRank: number;
  insights: Insight[];
  robust: Record<string, number>;
  cv: { kelas: string[]; akurasi_top1_uji: number; akurasi_top3_uji: number; f1_makro_uji: number; n_uji: number; ukuran_model_mb: number };
  rag: { hit_at_1: number; hit_at_5: number; akurasi_router: number; fpr_pada_tau: number; n_pertanyaan_positif: number };
  rekomendasi: { dasar: EvalRow; terpilih: EvalRow };
  sumberA: string;
  domain: Record<string, { n: number; tanpa: number }>;
}

export interface ManifestRow {
  dataset: string;
  url: string;
  lisensi: string;
  catatan: string | null;
  jumlah_baris: number | null;
  tanggal_ambil: string;
}

export const WARISAN = warisanRaw as unknown as WarisanFull[];
export const PROVINSI = provinsiRaw as unknown as Provinsi[];
export const RINGKASAN = ringkasanRaw as unknown as Ringkasan;
export const MANIFEST = manifestRaw as unknown as ManifestRow[];

const byId = new Map(WARISAN.map((w) => [w.id, w]));

export function getWarisan(id: string): WarisanFull | undefined {
  return byId.get(id);
}

export function getProvinsi(name: string): Provinsi | undefined {
  return PROVINSI.find((p) => p.provinsi === name);
}

export function hiddenOpen(limit = 12): WarisanFull[] {
  return WARISAN.filter((w) => w.kepekaan === 'terbuka' && w.rank !== null)
    .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9))
    .slice(0, limit);
}
