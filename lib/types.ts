export type DomainCode = 'ADAT_RITUS' | 'KERAJINAN' | 'PENGETAHUAN_ALAM' | 'PERTUNJUKAN' | 'LISAN';
export type Kepekaan = 'terbuka' | 'perlu_persetujuan';

export interface WarisanLite {
  id: string;
  nama: string;
  provinsi: string;
  domain: DomainCode | null;
  tahun: number;
  artikel: string | null;
  en: string | null;
  pv: number;
  V: number;
  IKD: number | null;
  rank: number | null;
  kepekaan: Kepekaan;
}

export interface WarisanFull extends WarisanLite {
  reg: string;
  alasan: string | null;
  vc: number[];
  ringkasan: string | null;
}

export interface Provinsi {
  provinsi: string;
  n: number;
  K: number;
  V: number;
  A: number;
  IKD: number;
  rank: number;
  tipologi: string;
  tanpaArtikel: number | null;
  museum: number;
  situs: number;
  wisnus: number;
  entropi: number;
  lat: number;
  lon: number;
}

export interface Sumber {
  nama: string;
  url: string;
  lisensi: string;
}

export interface ChatReply {
  jenis: 'intent' | 'rag' | 'tidak_tahu' | 'galat';
  jawaban: string;
  sumber?: Sumber[];
  saran?: string[];
  aksi?: string | null;
}
