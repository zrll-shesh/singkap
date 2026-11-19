# SINGKAP_output

Keluaran notebook **SINGKAP: Pipeline Data, Analisis, dan Model AI**, dibuat 2026-11-19T19:28:04.

## Ringkasan hasil

- WBTbI dianalisis: 1.925 (cakupan terhadap angka resmi 2025: 71,2%, sumber: wikipedia)
- Tanpa artikel Wikipedia bahasa Indonesia: 24,4%; bahasa Inggris: 87,8%
- Gini perhatian digital (pageviews 2025-11 s.d. 2026-10): 0,78
- Lima provinsi IKD tertinggi: Kepulauan Riau, Kepulauan Bangka Belitung, Maluku Utara, Jambi, Nusa Tenggara Timur
- Dimensi arus wisata (A): tersedia (manual)
- Rekomendasi berkeadilan: lambda 0,90, Gini eksposur 0,26 menjadi 0,24, NDCG@10 0,95
- Model rumah adat: akurasi top-1 79,2%, F1 makro 0,77, 10 kelas
- RAG: 2157 chunk, hit@1 95,2%, hit@5 99,7%, akurasi router 100,0%

## Struktur folder

```
SINGKAP_output
├── 01_data_mentah
│   └── wbtbi_wikipedia.html  (1.1 MB)
├── 02_data_olahan
│   ├── titik_warisan.csv
│   ├── wbtbi.csv
│   └── wbtbi_visibilitas.csv
├── 03_analisis
│   ├── ikd_item.csv
│   ├── ikd_provinsi.csv
│   ├── insights.json
│   ├── insights.md
│   ├── metodologi_ikd.md
│   ├── robust_ablasi_item.csv
│   ├── robust_spearman_provinsi.csv
│   ├── sampel_verifikasi_penautan.csv
│   ├── top100_warisan_paling_tersembunyi.csv
│   └── validasi_cakupan_wbtbi.csv
├── 04_visualisasi
│   ├── interaktif
│   │   ├── kuadran_provinsi.html
│   │   ├── peta_ikd_provinsi.html  (3.1 MB)
│   │   └── tradeoff_rekomendasi.html
│   ├── daftar_visualisasi.csv
│   ├── fig01_penetapan_per_tahun.png
│   ├── fig02_tanpa_artikel_per_domain.png
│   ├── fig03_tanpa_artikel_per_provinsi.png
│   ├── fig04_lorenz_pageviews.png
│   ├── fig05_peta_ikd_provinsi.png
│   ├── fig06_kuadran_k_vs_v.png
│   ├── fig07_top20_tersembunyi.png
│   ├── fig08_uji_ketahanan.png
│   ├── fig09_kepekaan_per_domain.png
│   ├── fig10_tradeoff_relevansi_pemerataan.png
│   ├── fig11_cv_sampel_dataset.png  (1.4 MB)
│   ├── fig12_cv_kurva_pelatihan.png
│   ├── fig13_cv_matriks_kebingungan.png
│   ├── fig14_cv_contoh_prediksi.png
│   └── fig15_kalibrasi_rag.png
├── 05_model_cv
│   ├── atribusi_gambar.csv
│   ├── labels.json
│   ├── laporan_klasifikasi_uji.csv
│   ├── metrics.json
│   ├── riwayat_pelatihan.csv
│   └── rumah_adat.onnx  (16.1 MB)
├── 06_rekomendasi
│   ├── contoh_alih_jejak_bali_tari.csv
│   ├── evaluasi_tradeoff.csv
│   ├── item_embeddings.npy  (1.5 MB)
│   ├── item_ids.json
│   └── recsys_config.json
├── 07_rag
│   ├── contoh_jawaban_gemini.csv
│   ├── intents.json
│   ├── kb_chunks.jsonl  (2.9 MB)
│   ├── kb_documents.jsonl  (2.9 MB)
│   ├── kb_embeddings.npy  (3.3 MB)
│   ├── kb_pgvector_import.csv  (10.9 MB)
│   ├── rag_config.json
│   ├── router_spec.md
│   ├── system_prompt.md
│   └── uji_router.csv
├── 08_data_web
│   ├── insights.json
│   ├── provinsi.geojson
│   ├── provinsi.json
│   ├── recsys_config.json
│   ├── ringkasan_proyek.json
│   ├── rumah_adat_labels.json
│   ├── titik_warisan.geojson  (1.7 MB)
│   └── warisan.json  (1.4 MB)
└── 09_manifest
    ├── data_manifest.csv
    └── run_log.json
```

## Panduan pemakaian untuk web

| Kebutuhan web | Berkas |
|---|---|
| Peta Singkap (choropleth) | `08_data_web/provinsi.geojson`, `08_data_web/provinsi.json` |
| Titik museum dan situs | `08_data_web/titik_warisan.geojson` |
| Kartu warisan dan pencarian | `08_data_web/warisan.json` |
| Jalur Singkap | `06_rekomendasi/item_embeddings.npy` (float16, urutan = `item_ids.json`), `08_data_web/recsys_config.json` |
| Kenali Rumah Adat | `05_model_cv/rumah_adat.onnx`, `08_data_web/rumah_adat_labels.json`, atribusi di `05_model_cv/atribusi_gambar.csv` |
| Tanya Singkap | `07_rag/kb_pgvector_import.csv` (impor ke Supabase pgvector), `07_rag/intents.json`, `07_rag/system_prompt.md`, `07_rag/rag_config.json`, `07_rag/router_spec.md` |
| Angka beranda | `08_data_web/ringkasan_proyek.json`, `08_data_web/insights.json` |
| Proposal | `03_analisis/insights.md`, `04_visualisasi/*.png`, `09_manifest/data_manifest.csv` |

## Peringatan selama eksekusi

- Kelas dengan gambar terlalu sedikit dikeluarkan: {'Rumah Adat Sasak': 34, 'Omo Hada Nias': 8}

## Langkah verifikasi manual yang disarankan

1. Isi kolom `benar_1_atau_0` pada `03_analisis/sampel_verifikasi_penautan.csv` untuk menghitung presisi penautan entitas.
2. Periksa grid `04_visualisasi/fig11_cv_sampel_dataset.png`; tulis judul berkas yang tidak relevan ke `singkap_input/cv_exclude.txt`, lalu latih ulang.
3. Bila dimensi arus wisata belum tersedia, isi `singkap_input/bps_arus_wisata.csv` dari tabel BPS lalu jalankan ulang.
4. Cek silang sampel `02_data_olahan/wbtbi.csv` dengan situs resmi Kementerian Kebudayaan.

## Landasan metodologi

Rumus IKD adalah rancangan tim SINGKAP dengan tahapan mengikuti OECD dan JRC (2008), Handbook on Constructing Composite Indicators.
Rujukan lengkap untuk IKD, rekomendasi berkeadilan, RAG, dan model computer vision ada di `03_analisis/metodologi_ikd.md`.

## Lisensi dan atribusi

Lihat `09_manifest/data_manifest.csv`. Teks turunan Wikipedia berlisensi CC BY-SA 4.0, data Wikidata CC0, data OpenStreetMap ODbL
(wajib atribusi "© OpenStreetMap contributors"), batas provinsi geoBoundaries CC BY 4.0, foto Commons sesuai lisensi per berkas.
