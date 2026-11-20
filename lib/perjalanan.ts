// Bandara utama tiap provinsi untuk panduan perjalanan Jalur Singkap.
// Catatan tambahan memberi pilihan rute lain yang umum dipakai.
export interface Rute {
  bandara: string;
  kode: string;
  kota: string;
  catatan?: { id: string; en: string };
}

const JAWA = {
  id: 'Dari kota lain di Pulau Jawa, kereta api juga pilihan yang nyaman.',
  en: 'From other cities on Java, the train is also a comfortable option.',
};

export const RUTE: Record<string, Rute> = {
  Aceh: { bandara: 'Bandara Sultan Iskandar Muda', kode: 'BTJ', kota: 'Banda Aceh' },
  'Sumatera Utara': { bandara: 'Bandara Kualanamu', kode: 'KNO', kota: 'Medan' },
  'Sumatera Barat': { bandara: 'Bandara Internasional Minangkabau', kode: 'PDG', kota: 'Padang' },
  Riau: { bandara: 'Bandara Sultan Syarif Kasim II', kode: 'PKU', kota: 'Pekanbaru' },
  Jambi: { bandara: 'Bandara Sultan Thaha', kode: 'DJB', kota: 'Jambi' },
  'Sumatera Selatan': { bandara: 'Bandara Sultan Mahmud Badaruddin II', kode: 'PLM', kota: 'Palembang' },
  Bengkulu: { bandara: 'Bandara Fatmawati Soekarno', kode: 'BKS', kota: 'Bengkulu' },
  Lampung: { bandara: 'Bandara Radin Inten II', kode: 'TKG', kota: 'Bandar Lampung' },
  'Kepulauan Bangka Belitung': {
    bandara: 'Bandara Depati Amir',
    kode: 'PGK',
    kota: 'Pangkalpinang',
    catatan: { id: 'Untuk Pulau Belitung, terbanglah ke Bandara H.A.S. Hanandjoeddin (TJQ).', en: 'For Belitung Island, fly to H.A.S. Hanandjoeddin Airport (TJQ).' },
  },
  'Kepulauan Riau': {
    bandara: 'Bandara Hang Nadim',
    kode: 'BTH',
    kota: 'Batam',
    catatan: {
      id: 'Dari Singapura, kamu juga bisa naik kapal feri ke Batam atau Bintan. Untuk Lingga dan pulau lain, lanjutkan dengan kapal dari Tanjungpinang.',
      en: 'From Singapore you can also take a ferry to Batam or Bintan. For Lingga and other islands, continue by boat from Tanjungpinang.',
    },
  },
  'DKI Jakarta': { bandara: 'Bandara Soekarno-Hatta', kode: 'CGK', kota: 'Jakarta', catatan: JAWA },
  'Jawa Barat': {
    bandara: 'Bandara Kertajati',
    kode: 'KJT',
    kota: 'Majalengka',
    catatan: { id: 'Kamu juga bisa terbang ke Jakarta (CGK), lalu naik kereta ke Bandung atau kota lain di Jawa Barat.', en: 'You can also fly to Jakarta (CGK), then take a train to Bandung or other cities in West Java.' },
  },
  'Jawa Tengah': {
    bandara: 'Bandara Jenderal Ahmad Yani',
    kode: 'SRG',
    kota: 'Semarang',
    catatan: { id: 'Untuk Solo dan sekitarnya, terbanglah ke Bandara Adi Soemarmo (SOC). Kereta api juga pilihan yang nyaman dari kota lain di Jawa.', en: 'For Solo and its surroundings, fly to Adi Soemarmo Airport (SOC). Trains are also convenient from other cities on Java.' },
  },
  'DI Yogyakarta': { bandara: 'Bandara Internasional Yogyakarta', kode: 'YIA', kota: 'Kulon Progo', catatan: JAWA },
  'Jawa Timur': { bandara: 'Bandara Juanda', kode: 'SUB', kota: 'Surabaya', catatan: JAWA },
  Banten: { bandara: 'Bandara Soekarno-Hatta', kode: 'CGK', kota: 'Tangerang', catatan: JAWA },
  Bali: { bandara: 'Bandara I Gusti Ngurah Rai', kode: 'DPS', kota: 'Denpasar' },
  'Nusa Tenggara Barat': { bandara: 'Bandara Internasional Lombok', kode: 'LOP', kota: 'Praya, Lombok' },
  'Nusa Tenggara Timur': {
    bandara: 'Bandara El Tari',
    kode: 'KOE',
    kota: 'Kupang',
    catatan: { id: 'Untuk Flores bagian barat, terbanglah ke Bandara Komodo (LBJ) di Labuan Bajo.', en: 'For western Flores, fly to Komodo Airport (LBJ) in Labuan Bajo.' },
  },
  'Kalimantan Barat': { bandara: 'Bandara Supadio', kode: 'PNK', kota: 'Pontianak' },
  'Kalimantan Tengah': { bandara: 'Bandara Tjilik Riwut', kode: 'PKY', kota: 'Palangka Raya' },
  'Kalimantan Selatan': { bandara: 'Bandara Syamsudin Noor', kode: 'BDJ', kota: 'Banjarbaru' },
  'Kalimantan Timur': {
    bandara: 'Bandara Sultan Aji Muhammad Sulaiman Sepinggan',
    kode: 'BPN',
    kota: 'Balikpapan',
    catatan: { id: 'Untuk Samarinda dan sekitarnya, terbanglah ke Bandara Aji Pangeran Tumenggung Pranoto (AAP).', en: 'For Samarinda and its surroundings, fly to Aji Pangeran Tumenggung Pranoto Airport (AAP).' },
  },
  'Kalimantan Utara': { bandara: 'Bandara Juwata', kode: 'TRK', kota: 'Tarakan' },
  'Sulawesi Utara': { bandara: 'Bandara Sam Ratulangi', kode: 'MDC', kota: 'Manado' },
  'Sulawesi Tengah': { bandara: 'Bandara Mutiara SIS Al-Jufrie', kode: 'PLW', kota: 'Palu' },
  'Sulawesi Selatan': { bandara: 'Bandara Sultan Hasanuddin', kode: 'UPG', kota: 'Makassar' },
  'Sulawesi Tenggara': { bandara: 'Bandara Haluoleo', kode: 'KDI', kota: 'Kendari' },
  Gorontalo: { bandara: 'Bandara Djalaluddin', kode: 'GTO', kota: 'Gorontalo' },
  'Sulawesi Barat': {
    bandara: 'Bandara Tampa Padang',
    kode: 'MJU',
    kota: 'Mamuju',
    catatan: { id: 'Banyak pelancong juga terbang ke Makassar (UPG), lalu melanjutkan perjalanan darat.', en: 'Many travellers also fly to Makassar (UPG) and continue by road.' },
  },
  Maluku: { bandara: 'Bandara Pattimura', kode: 'AMQ', kota: 'Ambon' },
  'Maluku Utara': { bandara: 'Bandara Sultan Babullah', kode: 'TTE', kota: 'Ternate' },
  'Papua Barat': {
    bandara: 'Bandara Rendani',
    kode: 'MKW',
    kota: 'Manokwari',
    catatan: { id: 'Untuk Sorong dan Raja Ampat, terbanglah ke Bandara Domine Eduard Osok (SOQ).', en: 'For Sorong and Raja Ampat, fly to Domine Eduard Osok Airport (SOQ).' },
  },
  Papua: { bandara: 'Bandara Sentani', kode: 'DJJ', kota: 'Jayapura' },
};
