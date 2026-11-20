# SINGKAP

**Sistem Inteligensi Nusantara Guna Kebangkitan Aset Pusaka**

> SINGKAP: Platform Kecerdasan Artifisial untuk Menyingkap Warisan Budaya Tersembunyi Indonesia melalui Indeks Ketakterlihatan Digital dan Rekomendasi Wisata Berkeadilan Berbasis Data Terbuka Nasional

*Singkap* berarti membuka tabir. SINGKAP membuka tabir atas warisan budaya yang sudah ditetapkan negara, tetapi belum terlihat di dunia digital dan jarang dikunjungi.

Kompetisi Inovasi Budaya Indonesia BUDAYA GO!, kategori Inovasi Digital, subtema Pengalaman Digital Wisata Budaya.

---

## Ringkasan

Indonesia telah menetapkan 2.727 Warisan Budaya Takbenda Indonesia (WBTbI) sejak 2013. Namun penetapan belum berarti dikenal. Kami menelusuri 1.925 warisan satu per satu dan menemukan bahwa satu dari empat belum punya artikel Wikipedia, hampir sembilan dari sepuluh tidak bisa ditemukan pembaca berbahasa Inggris, dan perhatian publik menumpuk pada segelintir warisan saja.

SINGKAP mengukur kesenjangan itu dengan **Indeks Ketakterlihatan Digital (IKD)**, lalu membawanya menjadi tindakan: peta tiga dimensi, rekomendasi wisata yang adil, pengenal rumah adat dari foto, asisten tanya jawab yang selalu menyebut sumber, dan dasbor prioritas untuk pemerintah daerah. Semuanya dibangun dari data terbuka yang bisa dihitung ulang siapa saja, dan dijaga oleh prinsip bahwa tidak semua warisan untuk ditonton.

---

## 1. Masalah

**Warisan berhenti di status penetapan.** Kementerian Kebudayaan sendiri menegaskan bahwa banyaknya WBTbI yang ditetapkan tidak boleh berhenti pada status penetapan. Jumlah penetapan terus bertambah (514 warisan pada 2025 saja), tetapi belum ada alat untuk mengetahui warisan mana yang paling perlu ditindaklanjuti.

**Wisata menumpuk di sedikit tempat.** Pada 2025, 45,8% kunjungan wisatawan mancanegara ke Indonesia tercatat di Bali, dan devisa pariwisata Bali setara 55% devisa pariwisata nasional. Manfaat ekonomi pariwisata budaya belum merata.

**Warisan tidak terlihat di internet.** Di era mesin pencari dan asisten AI, warisan yang tidak punya jejak digital praktis tidak ada bagi publik. Riset terbaru (2026) menemukan visibilitas Wikipedia berkaitan dengan popularitas digital objek wisata.

**Kesenjangannya belum pernah diukur.** Tanpa ukuran, promosi dan digitalisasi cenderung mengikuti yang sudah populer, sehingga ketimpangan makin kuat.

## 2. Gagasan inti

### Indeks Ketakterlihatan Digital (IKD)

```
IKD = K × (1 − V) × (1 − A)
```

| Dimensi | Tingkat | Indikator | Sumber |
|---|---|---|---|
| **K** kekayaan budaya | Provinsi | Jumlah WBTbI, keragaman domain (entropi Shannon), museum, situs warisan | Wikipedia, Wikidata, OpenStreetMap |
| **V** visibilitas digital | Warisan | Artikel bahasa Indonesia, artikel bahasa Inggris, butir Wikidata, gambar utama, kunjungan halaman 12 bulan, panjang artikel | MediaWiki API, Wikimedia Pageviews |
| **A** arus wisata | Provinsi | Perjalanan wisatawan nusantara 2025 menurut provinsi tujuan | BPS, diolah Kementerian Pariwisata |

IKD tinggi berarti warisan itu kaya secara budaya, sepi pembaca di internet, dan berada di daerah yang jarang dikunjungi.

Rumusnya rancangan tim SINGKAP, dengan setiap tahap mengikuti panduan baku indeks komposit OECD dan JRC (2008): normalisasi peringkat persentil, bobot setara yang diuji terhadap bobot PCA, dan agregasi perkalian yang tidak saling menutupi seperti rata-rata geometrik pada Indeks Pembangunan Manusia UNDP. Untuk arus wisata dipakai peringkat titik tengah agar provinsi teramai tidak otomatis bernilai nol.

### Rekomendasi wisata berkeadilan

```
skor = λ × relevansi + (1 − λ) × IKD
```

Relevansi dihitung dari kemiripan makna teks (embedding multilingual-e5-small) antara minat pengguna dan warisan, dikalikan kedekatan jarak ke tujuan. Daftar disusun dengan penalti untuk warisan dari provinsi yang sama, mengikuti gagasan keadilan eksposur (Singh dan Joachims, 2018) dan penataan ulang berbasis keberagaman (Carbonell dan Goldstein, 1998).

Nilai λ tidak ditebak, tetapi dipilih dengan aturan: kecocokan (NDCG@10) minimal 0,90, ketimpangan eksposur antarprovinsi tidak boleh naik, lalu dipilih yang paling banyak mengangkat warisan tersembunyi.

### Penjaga Kepekaan Budaya

Warisan pada domain adat istiadat, ritus, dan perayaan, serta warisan yang namanya memuat kata seperti upacara, ritual, sakral, atau pengobatan, diberi status **perlu persetujuan**. Warisan ini tetap tercatat dan bisa dipelajari, tetapi tidak pernah direkomendasikan sebagai objek wisata sampai komunitas atau pemerintah daerah setuju.

### Kebaruan

| Yang sudah ada | Keterbatasannya | Yang dilakukan SINGKAP |
|---|---|---|
| Daftar resmi WBTbI | Katalog statis tanpa prioritas | Mengukur kesenjangan nilai budaya, visibilitas, dan kunjungan dalam satu indeks |
| Pusat data warisan imersif | Berfokus menampilkan data | Berfokus menentukan apa yang perlu diangkat dan ke mana wisatawan diarahkan |
| Aplikasi rekomendasi wisata umum | Merekomendasikan yang sudah populer | Menaikkan eksposur daerah tersembunyi dengan kompromi yang terukur |
| Riset ketimpangan visibilitas wisata | Berhenti di temuan akademis | Menjadi produk dan dasbor kebijakan |

## 3. Cara kerja

```
Data terbuka (API resmi)            Analisis dan model (Google Colab)       Produk (web)
Wikipedia, Wikidata, Pageviews  ─►  Penautan entitas, IKD, uji        ─►  Peta Singkap, Jalur Singkap,
Commons, OpenStreetMap, BPS         ketahanan, statistik, embedding,      Jelajah, Kenali Rumah Adat,
                                    model rumah adat, knowledge base       Tanya Singkap, Dasbor Daerah
```

Seluruh pipeline ada di notebook `analisis/SINGKAP_pipeline_v2_done.ipynb`, dengan semua keluarannya di `analisis/SINGKAP_output/`. Tidak ada data yang diambil dari layanan yang melarang pengambilan otomatis seperti Google Maps, Instagram, atau TikTok.

## 4. Fitur

| Fitur | Untuk siapa | Yang bisa dilakukan |
|---|---|---|
| **Peta Singkap** | Semua | Peta tiga dimensi 34 provinsi menurut IKD, K, V, atau A; profil provinsi, komposisi domain, museum dan situs |
| **Jalur Singkap** | Wisatawan | Rekomendasi warisan sesuai minat dan tujuan, dengan pengaturan Pemerataan, perbandingan dengan rekomendasi biasa, dan panduan perjalanan langkah demi langkah (dari luar atau dalam negeri, bandara tujuan, cara menemukan lokasi, dan etika berkunjung) |
| **Jelajah warisan** | Semua | Cari dan saring 1.925 warisan menurut provinsi, domain, status artikel, dan kepekaan |
| **Halaman warisan** | Semua | Rumus IKD dengan angka asli warisan itu, komponen visibilitas, posisi di provinsinya, status kepekaan, sumber |
| **Kenali Rumah Adat** | Wisatawan, pelajar | Foto bangunan lalu AI di peramban mengenali 10 jenis rumah adat; foto tidak dikirim ke server |
| **Tanya Singkap** | Semua | Asisten tanya jawab yang menjawab dari knowledge base SINGKAP, selalu dengan sumber, dan berkata belum tahu bila sumbernya tidak ada |
| **Dasbor Prioritas Daerah** | Dinas kebudayaan dan pariwisata | Prioritas promosi, dokumentasi, penerjemahan, dan konfirmasi komunitas, bisa diunduh sebagai CSV |
| **Dwibahasa** | Semua | Seluruh antarmuka dan temuan dalam Bahasa Indonesia dan English |
| **Bantuan suara** | Penyandang disabilitas netra dan low vision, pengguna lanjut usia, pembelajar | Bacakan seluruh halaman, klik teks untuk dibacakan, tombol Dengarkan pada jawaban asisten, tiga pilihan kecepatan, dalam bahasa Indonesia atau Inggris |

## 5. Hasil temuan

1. **Satu dari empat warisan belum punya artikel.** Dari 1.925 WBTbI yang ditelusuri, 24,4% belum punya artikel Wikipedia bahasa Indonesia dan 87,8% belum punya versi bahasa Inggris.
2. **Perhatian menumpuk di segelintir warisan.** Sepuluh persen artikel teratas menyerap 69,0% seluruh kunjungan halaman dalam setahun. Median kunjungan hanya 304 per tahun, kurang dari satu pembaca per hari. Koefisien Gini 0,78.
3. **Pengetahuan tentang alam paling jarang ditulis.** Domain pengetahuan tentang alam dan semesta paling sering belum punya artikel (34,1%), sedangkan seni pertunjukan paling banyak ditulis (13,0%). Perbedaannya signifikan secara statistik (p < 0,05, Cramér's V 0,18).
4. **Penetapan baru tertinggal secara digital.** Warisan yang ditetapkan pada 2023 45,9% tanpa artikel, hampir dua kali lipat penetapan sebelumnya (21,7%). Perbedaannya signifikan secara statistik.
5. **Kaya budaya, sepi perhatian.** Lima provinsi dengan IKD tertinggi adalah Kepulauan Riau, Kepulauan Bangka Belitung, Maluku Utara, Jambi, dan Nusa Tenggara Timur. Bali berada di peringkat 16.
6. **Perhatian digital mengikuti keramaian, bukan kekayaan.** Visibilitas digital provinsi berkorelasi dengan arus wisatawan (Spearman 0,47, signifikan), tetapi tidak dengan kekayaan budayanya (0,26, tidak signifikan).
7. **Tidak semua warisan untuk ditonton.** 28,9% warisan adalah ritus, upacara, atau pengetahuan yang peka dan ditahan dari rekomendasi wisata.

### Peringkat provinsi

| Peringkat | Provinsi | IKD | Tipologi | Perjalanan wisatawan nusantara 2025 |
|---|---|---|---|---|
| 1 | Kepulauan Riau | 0,36 | Kaya namun tersembunyi | 4,3 juta |
| 2 | Kepulauan Bangka Belitung | 0,31 | Perlu pendataan lebih lanjut | 4,5 juta |
| 3 | Maluku Utara | 0,27 | Perlu pendataan lebih lanjut | 3,5 juta |
| 4 | Jambi | 0,25 | Kaya namun tersembunyi | 10,9 juta |
| 5 | Nusa Tenggara Timur | 0,22 | Kaya namun tersembunyi | 10,4 juta |
| 32 | Jawa Tengah | 0,03 | Kaya dan terlihat | 146,3 juta |
| 33 | Jawa Barat | 0,02 | Kaya dan terlihat | 211,8 juta |
| 34 | Jawa Timur | 0,01 | Kaya dan terlihat | 217,2 juta |

## 6. Hasil teknis

| Komponen | Hasil |
|---|---|
| Ketahanan IKD | Korelasi Spearman agregasi perkalian vs aditif 0,94; ablasi komponen visibilitas minimal 0,98 dengan irisan 100 teratas minimal 85%; tanpa dimensi A korelasinya 0,16, sehingga A menambah informasi yang berarti |
| Rekomendasi berkeadilan | Pada 400 pelancong simulasi, λ = 0,85 menaikkan rata-rata IKD rekomendasi dari 0,187 menjadi 0,227, menurunkan porsi lima provinsi paling terlihat dari 12,3% menjadi 8,2%, menurunkan Gini eksposur dari 0,346 menjadi 0,339, dengan NDCG@10 0,93 |
| Kenali Rumah Adat | EfficientNet-B0, 10 kelas, 197 foto uji: akurasi top-1 79,2%, top-3 91,9%, F1 makro 0,77; model ONNX 16 MB berjalan di peramban |
| Tanya Singkap | 2.149 potongan pengetahuan; dari 292 pertanyaan uji, dokumen tepat di posisi pertama 95,2% dan di lima teratas 99,7%; pertanyaan di luar topik tidak lolos (tingkat salah terima 0%); akurasi router sapaan 100% |
| Cakupan data | 1.925 WBTbI, 1.541 museum, dan 4.347 situs warisan terpetakan di 34 provinsi |

## 7. Keterkaitan budaya

Lima domain resmi WBTbI dipetakan ke tujuh unsur kebudayaan universal Koentjaraningrat, sehingga setiap warisan punya label budaya yang jelas.

| Domain WBTbI | Unsur kebudayaan |
|---|---|
| Tradisi dan ekspresi lisan | Bahasa, kesenian |
| Seni pertunjukan | Kesenian |
| Adat istiadat, ritus, dan perayaan | Sistem religi, organisasi sosial |
| Pengetahuan tentang alam dan semesta | Sistem pengetahuan, mata pencaharian |
| Kemahiran dan kerajinan tradisional | Peralatan hidup dan teknologi, mata pencaharian |

SINGKAP mendukung empat langkah pemajuan kebudayaan dalam UU Nomor 5 Tahun 2017: pelindungan melalui Penjaga Kepekaan Budaya, pengembangan melalui prioritas dokumentasi, pemanfaatan melalui rekomendasi wisata berkeadilan, dan pembinaan melalui Dasbor Prioritas Daerah.

## 8. Prinsip etika

- **Tidak semua warisan untuk ditonton.** Ritus dan upacara ditahan sampai ada persetujuan.
- **Tidak menciptakan keramaian baru.** Pemerataan dijaga agar tidak memindahkan kepadatan ke daerah lain.
- **AI sebagai alat bantu.** Asisten tidak mengarang narasi budaya dan selalu menyebut sumber.
- **Privasi.** Foto diproses di perangkat; percakapan tidak disimpan.
- **Suara komunitas.** Komunitas dan pemerintah daerah dapat meminta koreksi atau meminta warisan tidak ditampilkan.
- **Hormati lisensi.** Setiap teks dan gambar mencantumkan sumber dan lisensinya.

## 9. Model bisnis dan dampak

| Sumber pendapatan | Mekanisme |
|---|---|
| B2G | Langganan Dasbor Prioritas Daerah untuk dinas kebudayaan dan pariwisata |
| B2B | Akses data warisan tersembunyi untuk agen perjalanan dan platform pemesanan |
| Afiliasi | Komisi pemandu lokal dan paket wisata budaya di daerah tujuan |
| Sponsor dan CSR | Program dokumentasi dan penerjemahan warisan bersama perusahaan atau lembaga |

Dampak yang dituju: warisan yang sudah ditetapkan menjadi lebih terlihat dan terdokumentasi, sebagian arus wisata bergeser ke daerah yang tertinggal, pemerintah daerah punya dasar data untuk menindaklanjuti penetapan, dan komunitas memegang kendali atas representasi warisannya. Biaya operasional rendah karena pipeline otomatis dan model AI berjalan di perangkat pengguna. Besaran harga akan ditetapkan setelah validasi pasar.

## 10. Keterbatasan

- Data mencakup 1.925 dari 2.727 WBTbI resmi (penetapan 2013 sampai 2023). Penetapan 2024 dan 2025 belum tercantum di daftar Wikipedia yang menjadi sumber.
- Wikipedia bukan sumber primer; sampelnya dicek silang dengan situs resmi Kementerian Kebudayaan.
- Tidak punya artikel berarti sulit ditemukan di internet, bukan berarti tidak dikenal masyarakat setempat.
- Arus wisata memakai perjalanan wisatawan nusantara karena data wisatawan mancanegara per provinsi tidak tersedia terbuka.
- Rekomendasi dievaluasi dengan pelancong simulasi; uji dengan pengguna nyata dan pemerintah daerah direncanakan.
- Dua jenis rumah adat (Sasak dan Nias) belum masuk model karena foto berlisensi terbukanya belum cukup.

## 11. Tim

| Peran | Anggota |
|---|---|
| Pengembangan produk dan model AI | Nazril, Sains Data, Universitas Negeri Surabaya angkatan 2024 |
| Data dan kebudayaan | Nadia, Sains Data, Universitas Negeri Surabaya angkatan 2023 |
| Ekonomi, kemitraan, dan web | Angel, Sistem Informasi angkatan 2023 |

## 12. Sumber data

| Data | Lisensi |
|---|---|
| Daftar WBTbI dan ringkasan artikel, Wikipedia bahasa Indonesia | CC BY-SA 4.0 |
| Butir warisan dan museum, Wikidata | CC0 |
| Kunjungan halaman, Wikimedia Pageviews | Data terbuka |
| Museum dan situs bersejarah, OpenStreetMap | ODbL |
| Batas provinsi, geoBoundaries | CC BY 4.0 |
| Foto pelatihan rumah adat, Wikimedia Commons | Lisensi per berkas (`public/data/atribusi_gambar.csv`) |
| Perjalanan wisatawan nusantara 2025, BPS via Kementerian Pariwisata | Data resmi |

## 13. Rujukan

1. OECD dan JRC (2008). *Handbook on Constructing Composite Indicators: Methodology and User Guide*. OECD Publishing.
2. UNDP. *Human Development Report, Technical Notes*.
3. Shannon, C. E. (1948). A Mathematical Theory of Communication. *Bell System Technical Journal*, 27.
4. Gini, C. (1912). *Variabilità e mutabilità*. Lorenz, M. O. (1905). Methods of measuring the concentration of wealth. *JASA*, 9(70).
5. Wikipedia visibility and Instagram hashtag intensity in urban tourism (2026). *Information Technology and Tourism*.
6. Analysis of the dissemination pathways for the influence of intangible cultural tourism (2026). *Discover Artificial Intelligence*.
7. Singh, A. dan Joachims, T. (2018). Fairness of Exposure in Rankings. *KDD 2018*.
8. Carbonell, J. dan Goldstein, J. (1998). The Use of MMR, Diversity-Based Reranking. *SIGIR 1998*.
9. Järvelin, K. dan Kekäläinen, J. (2002). Cumulated gain-based evaluation of IR techniques. *ACM TOIS*, 20(4).
10. Robertson, S. dan Zaragoza, H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond.
11. Lewis, P. dkk. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *NeurIPS 2020*.
12. Wang, L. dkk. (2024). Multilingual E5 Text Embeddings: A Technical Report. arXiv:2402.05672.
13. Tan, M. dan Le, Q. (2019). EfficientNet. *ICML 2019*.
14. Koentjaraningrat. *Pengantar Ilmu Antropologi*. Rineka Cipta.
15. Undang-Undang Nomor 5 Tahun 2017 tentang Pemajuan Kebudayaan.

---

Panduan menjalankan dan men-deploy web ada di [TEKNIS.md](TEKNIS.md).
