# SINGKAP Web: panduan teknis

Sistem Inteligensi Nusantara Guna Kebangkitan Aset Pusaka. Platform web untuk mengukur dan menyingkap Warisan Budaya Takbenda Indonesia yang sudah ditetapkan tetapi belum terlihat.

## Bahasa

Seluruh antarmuka tersedia dalam Bahasa Indonesia dan English. Tombol ID dan EN di kanan atas menyimpan pilihan di cookie `singkap_lang`. Kunjungan pertama memakai bahasa peramban. Teks antarmuka ada di `lib/i18n.ts`; temuan analisis dwibahasa dibuat oleh `scripts/build_data.py`. Nama warisan, nama provinsi, dan ringkasan Wikipedia ditampilkan dalam bahasa aslinya. Tanya Singkap menjawab dalam bahasa yang dipilih.

## Fitur

| Halaman | Isi |
|---|---|
| `/` | Peta Nusantara berkabut yang bisa disingkap dengan kursor, temuan utama, warisan tersembunyi pekan ini |
| `/peta` | Peta 3D (MapLibre) IKD, K, V, A per provinsi, museum dan situs, profil provinsi |
| `/jalur` | Rekomendasi wisata berkeadilan dengan pengaturan Pemerataan dan perbandingan dengan rekomendasi biasa |
| `/jelajah` | Pencarian dan filter seluruh warisan |
| `/warisan/[id]` | Detail warisan, rumus IKD dengan angka asli, komponen visibilitas, status kepekaan, sumber |
| `/kenali` | Kenali Rumah Adat, model ONNX berjalan di peramban (onnxruntime-web) |
| `/tanya` | Tanya Singkap, asisten RAG (router sapaan, BM25, Gemini) dengan sumber |
| `/dasbor` | Dasbor Prioritas Daerah dengan unduhan CSV |
| `/metodologi`, `/tentang` | Metodologi, rujukan, data, keterbatasan, etika, lisensi |

## Menjalankan secara lokal

Butuh Node.js 20.9 atau lebih baru (Next.js 16, React 19). `npm audit` saat rilis: 0 kerentanan.

```bash
npm install
cp .env.example .env.local   # isi GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

## Deploy ke Vercel

1. Unggah folder ini ke repositori GitHub (tanpa `node_modules` dan `.next`).
2. Di Vercel: Add New Project, pilih repositori. Framework terdeteksi otomatis sebagai Next.js.
3. Di Settings > Environment Variables, tambahkan:

| Nama | Wajib | Isi |
|---|---|---|
| `GEMINI_API_KEY` | Ya | API key dari Google AI Studio |
| `GEMINI_MODEL` | Tidak | Bawaan `gemini-3.5-flash-lite` |
| `NEXT_PUBLIC_KONTAK_EMAIL` | Tidak | Email tim untuk tombol Ajukan koreksi |
| `NEXT_PUBLIC_SITE_URL` | Tidak | Alamat situs, misalnya `https://singkap.vercel.app` |

4. Deploy. Setelah mengubah environment variable, lakukan Redeploy.

Tanpa `GEMINI_API_KEY`, Tanya Singkap tetap berjalan: sapaan dijawab router, dan pertanyaan yang cocok dijawab langsung dari potongan knowledge base beserta sumbernya.

## Memperbarui data dari notebook

Folder `data/` dan `public/data/` dibuat oleh skrip dari keluaran notebook `SINGKAP_pipeline.ipynb`.

```bash
pip install pandas numpy scipy beautifulsoup4 lxml
python scripts/build_data.py analisis/SINGKAP_output
```

Skrip ini membaca ulang tabel WBTbI dengan dukungan rowspan, menambahkan dimensi arus wisata dari data resmi BPS 2025, menghitung ulang IKD, temuan, dan konfigurasi rekomendasi, membangun knowledge base, lalu menyalin model dan gambar.

Untuk menjalankan ulang notebook dengan dimensi arus wisata, salin `scripts/bps_arus_wisata.csv` ke folder `/content/singkap_input/` di Colab sebelum Run all.

## Hasil analisis

Folder `analisis/` berisi notebook yang sudah dijalankan (`SINGKAP_pipeline_v2_done.ipynb`) dan seluruh keluarannya (`SINGKAP_output/`: data, grafik, model, knowledge base, manifest). Folder ini tidak ikut diunggah ke Vercel (lihat `.vercelignore`).

## Struktur

```
app/                 halaman (App Router) dan API /api/chat
components/          komponen antarmuka (peta, kabut, rekomendasi, obrolan, dsb.)
lib/                 tipe, format angka, akses data, RAG
data/                data untuk server (warisan, provinsi, ringkasan, knowledge base, intents)
public/data/         data untuk peramban (GeoJSON, daftar warisan, rekomendasi, atribusi foto)
public/models/       model ONNX rumah adat dan labelnya
public/figures/      grafik dari notebook untuk halaman metodologi
scripts/             build_data.py dan data BPS
analisis/            notebook yang sudah dijalankan dan keluarannya (tidak ikut deploy)
```

## Catatan teknis

- Skrip `scripts/prepare-assets.mjs` berjalan otomatis saat `npm install` dan `npm run build`: menyalin worker MapLibre ke `public/maplibre/`, menyalin onnxruntime-web ke `public/ort/` (model AI tidak bergantung CDN), dan mengunduh 9 contoh foto rumah adat dari Wikimedia Commons ke `public/samples/`. Bila unduhan gagal, peramban memuat contoh foto langsung dari Wikimedia.
- Kenali Rumah Adat bisa membuka kamera langsung (perlu HTTPS, otomatis di Vercel; di lokal berlaku untuk `localhost`).
- Bantuan suara memakai Web Speech API bawaan peramban (`lib/speech.ts`, `components/SpeechProvider.tsx`, `components/SuaraMenu.tsx`), tanpa layanan luar dan tanpa biaya. Suara yang tersedia bergantung pada perangkat; suara bahasa Indonesia tersedia di Chrome, Edge, Android, dan iOS.
- Peta tidak memakai basemap pihak ketiga. Hanya poligon provinsi (geoBoundaries) dan titik (Wikidata, OpenStreetMap), sehingga tidak memerlukan API key peta.
- Model ONNX (16 MB) dan onnxruntime-web dimuat hanya saat halaman Kenali dibuka, lalu di-cache peramban.
- Huruf Marcellus (judul) dan Plus Jakarta Sans (isi) di-host sendiri melalui Fontsource.
- Grafik di halaman Metodologi dan Beranda dibuat sebagai SVG beranimasi dari data (`components/Charts.tsx`), bukan gambar statis, sehingga mengikuti bahasa yang dipilih.
- Latar memakai motif kawung yang bergeser perlahan dan pita tumpal di tepi bagian; animasi berhenti bila pengguna memilih kurangi gerakan.
- Pembatas laju sederhana di `/api/chat`: 20 pertanyaan per menit per alamat IP pada setiap instance.

## Lisensi data

Teks turunan Wikipedia CC BY-SA 4.0, Wikidata CC0, OpenStreetMap ODbL, geoBoundaries CC BY 4.0, foto Commons sesuai lisensi per berkas (`public/data/atribusi_gambar.csv`), data arus wisata dari BPS.
