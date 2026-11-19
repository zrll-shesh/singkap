# Temuan utama SINGKAP

**1. Sebagian besar warisan belum memiliki artikel.** Dari 1.925 WBTbI yang dianalisis, 24,4% (469 warisan) belum memiliki artikel Wikipedia bahasa Indonesia, dan 87,8% belum memiliki artikel bahasa Inggris.

**2. Perhatian publik sangat timpang.** Di antara warisan yang sudah memiliki artikel, koefisien Gini kunjungan halaman mencapai 0,78. Sepuluh persen artikel teratas menyerap 69,0% seluruh kunjungan selama 2025-11 s.d. 2026-10, sedangkan median kunjungan hanya 304 per tahun.

**3. Ketakterlihatan berbeda antardomain.** Domain Pengetahuan dan Kebiasaan Perilaku Mengenai Alam dan Semesta paling tersembunyi (34,1% tanpa artikel), sedangkan Seni Pertunjukan paling terlihat (13,0% tanpa artikel). Hubungan domain dan keberadaan artikel signifikan secara statistik (p < 0,05), Cramér's V = 0,18.

**4. Penetapan baru belum terlihat.** Warisan yang ditetapkan sejak 2023 45,9% tanpa artikel, dibandingkan 21,7% untuk penetapan sebelum 2023. Perbedaan visibilitasnya signifikan secara statistik (p < 0,05).

**5. Provinsi kaya budaya namun tersembunyi.** Terdapat 6 provinsi dengan kekayaan budaya di atas median tetapi visibilitas di bawah median: Jambi, Lampung, Kepulauan Riau, DI Yogyakarta, Bali, Nusa Tenggara Timur. Lima provinsi dengan IKD tertinggi: Kepulauan Riau, Kepulauan Bangka Belitung, Maluku Utara, Jambi, Nusa Tenggara Timur.

**6. Kekayaan tidak menjamin visibilitas.** Korelasi Spearman antara kekayaan budaya (K) dan visibilitas (V) provinsi adalah 0,26 dan tidak signifikan secara statistik (p >= 0,05).

**7. Arus wisata dan visibilitas digital.** Korelasi Spearman antara arus wisata (A) dan visibilitas (V) provinsi adalah 0,47, signifikan secara statistik (p < 0,05).

**8. Indeks stabil terhadap pilihan bobot.** Korelasi Spearman terendah antarskema agregasi pada tingkat provinsi adalah 0,90, dan pada uji ablasi tingkat warisan 0,98, dengan irisan 100 warisan teratas paling rendah 86%. Menghapus dimensi arus wisata menghasilkan korelasi 0,16 dengan versi dasar, sehingga dimensi A memberi informasi tambahan yang berarti.

**9. Porsi warisan yang perlu persetujuan.** Sebanyak 28,9% warisan ditandai perlu persetujuan oleh Penjaga Kepekaan Budaya dan tidak direkomendasikan sebagai objek wisata sebelum dikonfirmasi pemda atau komunitas.

**10. Menyingkap warisan tersembunyi tanpa menciptakan keramaian baru.** Pada simulasi 400 pengguna, konfigurasi λ = 0,90 dengan penalti keberagaman provinsi menaikkan rata-rata IKD warisan yang direkomendasikan dari 0,129 menjadi 0,153, mengubah porsi eksposur lima provinsi paling terlihat dari 15,0% menjadi 12,2%, dan menurunkan Gini eksposur antarprovinsi (0,26 menjadi 0,24), dengan retensi relevansi NDCG@10 sebesar 0,95.

**11. Model Kenali Rumah Adat.** Model efficientnet_b0 untuk 10 jenis rumah adat mencapai akurasi top-1 79,2%, akurasi top-3 91,9%, dan F1 makro 0,77 pada 197 gambar uji. Model berukuran 16.07 MB dan berjalan di peramban melalui ONNX.

**12. Asisten yang tahu batas pengetahuannya.** Pada uji 292 pertanyaan dalam cakupan, dokumen yang tepat ditemukan di posisi pertama untuk 95,2% pertanyaan dan di lima teratas untuk 99,7%. Ambang terkalibrasi memisahkan pertanyaan di luar cakupan dengan tingkat salah terima 0,0%.