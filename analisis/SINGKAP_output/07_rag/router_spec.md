# Spesifikasi router Tanya Singkap

1. Normalisasi pesan: huruf kecil, hapus tanda baca, rapikan spasi.
2. Deteksi intent: cocokkan pola regex `intents.json` dengan batas jumlah kata `maks_kata` per intent. Bila tidak cocok dan pesan maksimal 3 kata,
   bandingkan embedding pesan dengan embedding contoh intent (ambang 0,93).
3. Bila intent ditemukan: kirim salah satu jawaban intent dan quick replies. Tidak perlu memanggil LLM.
4. Bila pesan diawali sapaan lalu berisi pertanyaan: hapus sapaan (`pola_sapaan_awal`), lanjutkan ke retrieval,
   dan minta LLM membuka jawaban dengan sapaan singkat.
5. Retrieval: embedding `query: <pesan>`, ambil top_k chunk dari pgvector (cosine).
6. Bila skor tertinggi < ambang_tau DAN pesan tidak cocok `pola_topik`: tampilkan jawaban "belum tahu" beserta quick replies.
   Bila skor di bawah ambang tetapi pesan bertopik budaya, tetap teruskan ke LLM; aturan sistem memastikan LLM menyatakan
   belum tahu bila konteks tidak memadai.
7. Bila pesan cocok `pola_aksi_rekomendasi`: tampilkan tombol menuju Jalur Singkap di samping jawaban.
8. Generasi: system prompt dari `system_prompt.md`, konteks bernomor [1]..[k], temperature 0,2.
   Tampilkan daftar sumber (nama, URL, lisensi) di bawah jawaban.
