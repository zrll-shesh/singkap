import type { Metadata } from 'next';
import { LorenzChart, QuadrantChart, RobustChart, TradeoffChart, YearChart, BarsFigure } from '@/components/Charts';
import { MANIFEST, PROVINSI, RINGKASAN } from '@/lib/data';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getI18n()).lang === 'en';
  return { title: en ? 'Methodology and data' : 'Metodologi dan data' };
}

const RUJUKAN = [
  'OECD & JRC (2008). Handbook on Constructing Composite Indicators: Methodology and User Guide. OECD Publishing, Paris.',
  'UNDP. Human Development Report, Technical Notes (geometric mean aggregation of the Human Development Index since 2010).',
  'Shannon, C. E. (1948). A Mathematical Theory of Communication. Bell System Technical Journal, 27.',
  'Gini, C. (1912). Variabilità e mutabilità. Lorenz, M. O. (1905). Methods of measuring the concentration of wealth. JASA, 9(70).',
  'Wikipedia visibility and Instagram hashtag intensity in urban tourism: an AI-based multilingual analysis of tourist attractions in Seville (2026). Information Technology & Tourism.',
  'Analysis of the dissemination pathways for the influence of intangible cultural tourism empowered by spatio-temporal graph neural networks (2026). Discover Artificial Intelligence.',
  'Singh, A. & Joachims, T. (2018). Fairness of Exposure in Rankings. KDD 2018.',
  'Carbonell, J. & Goldstein, J. (1998). The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries. SIGIR 1998.',
  'Järvelin, K. & Kekäläinen, J. (2002). Cumulated gain-based evaluation of IR techniques. ACM TOIS, 20(4).',
  'Robertson, S. & Zaragoza, H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond. Foundations and Trends in IR.',
  'Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS 2020.',
  'Wang, L. et al. (2024). Multilingual E5 Text Embeddings: A Technical Report. arXiv:2402.05672.',
  'Tan, M. & Le, Q. (2019). EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks. ICML 2019.',
  'Koentjaraningrat. Pengantar Ilmu Antropologi. Jakarta: Rineka Cipta.',
];

export default async function MetodologiPage() {
  const { f, lang } = await getI18n();
  const en = lang === 'en';
  const L = (id: string, e: string) => (en ? e : id);
  const R = RINGKASAN;
  const rec = R.rekomendasi;
  const rb = R.robust;
  const dki = R.dkiPerkiraan;
  const G = R.grafik;

  return (
    <>
      <header className="halaman-kepala">
        <div className="wadah">
          <h1>{L('Metodologi dan data', 'Methodology and data')}</h1>
          <p>
            {L(
              'Setiap angka di SINGKAP berasal dari data terbuka yang bisa dihitung ulang siapa saja. Di sini kami menjelaskan cara menghitungnya, seberapa bisa dipercaya, dan apa yang belum bisa kami ukur.',
              'Every number in SINGKAP comes from open data that anyone can recompute. Here we explain how we calculate it, how far it can be trusted, and what we cannot measure yet.',
            )}
          </p>
        </div>
      </header>
      <div className="wadah isi prosa">
        <h2 style={{ marginTop: 0 }}>{L('Indeks Ketakterlihatan Digital', 'Digital Invisibility Index')}</h2>
        <div className="rumus">
          {L('IKD', 'Index')} = <span className="k">K</span> × (1 − <span className="k">V</span>) × (1 − <span className="k">A</span>)
        </div>
        <div className="tabel-wadah" style={{ marginTop: 20 }}>
          <table>
            <thead>
              <tr>
                <th>{L('Dimensi', 'Dimension')}</th>
                <th>{L('Tingkat', 'Level')}</th>
                <th>{L('Indikator', 'Indicators')}</th>
                <th>{L('Sumber', 'Source')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{L('K, kekayaan budaya', 'K, cultural richness')}</td>
                <td>{L('Provinsi', 'Province')}</td>
                <td>
                  {L(
                    'Jumlah WBTbI, keragaman domain (entropi Shannon), jumlah museum, jumlah situs warisan',
                    'Number of designated items, domain diversity (Shannon entropy), museums, heritage sites',
                  )}
                </td>
                <td>Wikipedia, Wikidata, OpenStreetMap</td>
              </tr>
              <tr>
                <td>{L('V, visibilitas digital', 'V, digital visibility')}</td>
                <td>{L('Warisan', 'Item')}</td>
                <td>
                  {L(
                    'Artikel bahasa Indonesia dan Inggris, butir Wikidata, gambar utama, kunjungan halaman 12 bulan, panjang artikel',
                    'Indonesian and English articles, Wikidata item, lead image, 12-month page views, article length',
                  )}
                </td>
                <td>MediaWiki API, Wikimedia Pageviews</td>
              </tr>
              <tr>
                <td>{L('A, arus wisata', 'A, tourist flow')}</td>
                <td>{L('Provinsi', 'Province')}</td>
                <td>{L('Perjalanan wisatawan nusantara 2025 menurut provinsi tujuan', '2025 domestic trips by destination province')}</td>
                <td>{L('BPS, diolah Kementerian Pariwisata', 'Statistics Indonesia, via the Ministry of Tourism')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 20 }}>
          {L(
            'Rumus ini rancangan tim SINGKAP, dan setiap langkahnya mengikuti panduan baku indeks komposit OECD dan JRC (2008). Indikator dinormalisasi dengan peringkat persentil supaya tidak terseret nilai ekstrem. Untuk arus wisata kami memakai peringkat titik tengah, sehingga provinsi teramai tidak otomatis bernilai nol. Kami memilih perkalian karena sifatnya tidak saling menutupi, sama seperti rata-rata geometrik pada Indeks Pembangunan Manusia UNDP: warisan dari daerah yang miskin data tidak mendapat skor tinggi hanya karena tidak terlihat.',
            'The formula was designed by the SINGKAP team, and every step follows the OECD and JRC (2008) handbook for composite indicators. Indicators are normalised with percentile ranks so extreme values do not dominate. Tourist flow uses mid-point ranks, so the busiest province is not forced to zero. We multiply rather than add because the dimensions should not compensate each other, like the geometric mean in UNDP’s Human Development Index: an item from a data-poor region does not score high just because it is invisible.',
          )}
        </p>

        <h2>{L('Seberapa kuat peringkatnya', 'How robust the ranking is')}</h2>
        <p>
          {L(
            `Mengganti agregasi perkalian dengan penjumlahan tetap memberi korelasi Spearman ${f.dec(rb.spearman_dasar_vs_aditif)}. Menghapus komponen visibilitas satu per satu memberi korelasi terendah ${f.dec(rb.spearman_ablasi_min)}, dengan irisan 100 warisan teratas minimal ${f.pct(rb.irisan_top100_min, 0)}. Tanpa arus wisata korelasinya hanya ${f.dec(rb.spearman_dasar_vs_tanpa_A)}, jadi dimensi itu benar-benar menambah informasi.`,
            `Replacing multiplication with addition keeps a Spearman correlation of ${f.dec(rb.spearman_dasar_vs_aditif)}. Removing visibility components one by one gives a lowest correlation of ${f.dec(rb.spearman_ablasi_min)}, with at least ${f.pct(rb.irisan_top100_min, 0)} overlap in the top 100. Without tourist flow the correlation is only ${f.dec(rb.spearman_dasar_vs_tanpa_A)}, so that dimension genuinely adds information.`,
          )}
        </p>
        <RobustChart
          rho={G.rho}
          ablasi={G.ablasi}
          title={L('Uji ketahanan: peringkat tetap stabil', 'Robustness: the ranking stays stable')}
          caption={L(
            'Kiri: korelasi peringkat provinsi antara tiga cara menghitung indeks; makin mendekati 1, makin sama hasilnya. Kanan: irisan 100 warisan paling tersembunyi ketika satu komponen visibilitas dihapus. Semua tetap tinggi, jadi hasilnya tidak bergantung pada satu pilihan metode.',
            'Left: rank correlation of provinces between three ways of computing the index; closer to 1 means the same result. Right: overlap of the 100 most hidden items when one visibility component is removed. All remain high, so the result does not hinge on one methodological choice.',
          )}
        />

        <h2>{L('Semua temuan', 'All findings')}</h2>
        <ol className="daftar-temuan">
          {R.insights.map((x) => (
            <li key={x.id}>
              <strong>{en ? x.judul_en ?? x.judul : x.judul}.</strong> {en ? x.teks_en ?? x.teks : x.teks}
              {(en ? x.makna_en : x.makna) && <p className="makna">{en ? x.makna_en : x.makna}</p>}
            </li>
          ))}
        </ol>
        <YearChart
          rows={G.perTahun}
          title={L('Makin baru ditetapkan, makin tidak terlihat', 'The newer the designation, the less visible')}
          caption={L(
            'Jumlah warisan yang ditetapkan per tahun. Bagian kuning adalah warisan yang belum punya artikel Wikipedia, dan angka di atas batang adalah persentasenya. Sejak 2019, porsinya melonjak dari satu digit menjadi lebih dari sepertiga.',
            'Items designated each year. The yellow part has no Wikipedia article, with its share shown above each bar. Since 2019 the share jumped from single digits to more than a third.',
          )}
        />
        <LorenzChart
          points={G.lorenz}
          top10={R.top10}
          gini={R.gini}
          title={L('Ketimpangan perhatian digital', 'Inequality of digital attention')}
          caption={L(
            'Kurva Lorenz kunjungan halaman artikel warisan. Garis putus-putus adalah keadaan merata sempurna; makin jauh kurva kuning darinya, makin timpang. Sembilan puluh persen artikel hanya berbagi sebagian kecil perhatian publik.',
            'Lorenz curve of page views for heritage articles. The dashed line is perfect equality; the further the yellow curve falls from it, the more unequal. Ninety percent of articles share only a small slice of public attention.',
          )}
        />
        <QuadrantChart
          data={PROVINSI.map((p) => ({ provinsi: p.provinsi, K: p.K, V: p.V, IKD: p.IKD, n: p.n, rank: p.rank }))}
          title={L('Provinsi menurut kekayaan budaya dan visibilitas digital', 'Provinces by cultural richness and digital visibility')}
          caption={L(
            'Setiap gelembung adalah satu provinsi; ukurannya jumlah warisan, warnanya nilai IKD. Kotak kuning di kiri atas berisi provinsi yang kaya budaya namun tersembunyi. Arahkan kursor ke gelembung untuk melihat detailnya.',
            'Each bubble is a province; size is the number of items, colour is the index. The yellow box at top left holds provinces that are culturally rich but hidden. Hover a bubble to see its details.',
          )}
        />

        <h2>{L('Rekomendasi yang adil', 'Fair recommendations')}</h2>
        <p>
          {L(
            'Jalur Singkap memberi skor λ × relevansi + (1 − λ) × IKD, lalu menyusun daftar dengan penalti untuk warisan dari provinsi yang sama. Gagasannya berasal dari keadilan eksposur (Singh dan Joachims, 2018) dan penataan ulang berbasis keberagaman (Carbonell dan Goldstein, 1998). Relevansi dihitung dari kemiripan makna teks memakai embedding multilingual-e5-small, dikalikan kedekatan jarak ke tujuan.',
            'SINGKAP routes score items as λ × relevance + (1 − λ) × index, then build the list with a penalty for items from the same province. The idea comes from fairness of exposure (Singh and Joachims, 2018) and diversity-based re-ranking (Carbonell and Goldstein, 1998). Relevance is semantic similarity from multilingual-e5-small embeddings, weighted by distance to the destination.',
          )}
        </p>
        <p>
          {L(
            `λ dipilih dengan aturan: kecocokan (NDCG@10) minimal 0,90, ketimpangan eksposur antarprovinsi tidak boleh naik, lalu yang paling banyak mengangkat warisan tersembunyi. Pada 400 pelancong simulasi, λ = ${f.dec(rec.terpilih.lambda)} menaikkan rata-rata IKD rekomendasi dari ${f.dec(rec.dasar.ikd_rata2, 3)} menjadi ${f.dec(rec.terpilih.ikd_rata2, 3)}, menurunkan porsi lima provinsi paling terlihat dari ${f.pct(rec.dasar.porsi_5_terlihat)} menjadi ${f.pct(rec.terpilih.porsi_5_terlihat)}, dengan NDCG@10 ${f.dec(rec.terpilih.ndcg10)} dan Gini eksposur ${f.dec(rec.dasar.gini)} menjadi ${f.dec(rec.terpilih.gini)}.`,
            `λ is chosen by a rule: relevance (NDCG@10) of at least 0.90, inequality of exposure across provinces must not rise, then whichever lifts hidden heritage the most. Across 400 simulated travellers, λ = ${f.dec(rec.terpilih.lambda)} raises the average index of suggestions from ${f.dec(rec.dasar.ikd_rata2, 3)} to ${f.dec(rec.terpilih.ikd_rata2, 3)} and lowers the share of the five most visible provinces from ${f.pct(rec.dasar.porsi_5_terlihat)} to ${f.pct(rec.terpilih.porsi_5_terlihat)}, with NDCG@10 of ${f.dec(rec.terpilih.ndcg10)} and exposure Gini moving from ${f.dec(rec.dasar.gini)} to ${f.dec(rec.terpilih.gini)}.`,
          )}
        </p>
        <TradeoffChart
          kurva={G.kurva}
          dasar={G.dasar}
          pilih={rec.terpilih.lambda}
          title={L('Menukar sedikit relevansi untuk banyak keterungkapan', 'Trading a little relevance for much more discovery')}
          caption={L(
            `Setiap titik adalah satu nilai λ. Bergerak ke kanan berarti rekomendasi makin banyak mengangkat warisan tersembunyi; bergerak ke bawah berarti makin kurang sesuai minat. SINGKAP memilih λ = ${f.dec(rec.terpilih.lambda)}: rata-rata IKD naik ${f.pct(rec.terpilih.ikd_rata2 / rec.dasar.ikd_rata2 - 1, 0)} sementara relevansi tetap di atas batas 0,90.`,
            `Each point is one λ value. Moving right means suggestions lift more hidden heritage; moving down means they match interests less. SINGKAP picks λ = ${f.dec(rec.terpilih.lambda)}: the average index rises ${f.pct(rec.terpilih.ikd_rata2 / rec.dasar.ikd_rata2 - 1, 0)} while relevance stays above the 0.90 line.`,
          )}
        />

        <h2>{L('Tanya Singkap', 'Ask SINGKAP')}</h2>
        <p>
          {L(
            `Asisten memakai pola Retrieval-Augmented Generation (Lewis dkk., 2020). Sapaan dan obrolan ringan dijawab oleh router. Pertanyaan lain dicarikan potongan pengetahuan dengan BM25, lalu dijawab model Gemini yang wajib menyebut nomor sumber dan berkata belum tahu bila konteksnya kurang. Di notebook, pencarian semantik menemukan dokumen yang tepat di posisi pertama untuk ${f.pct(R.rag.hit_at_1)} dan di lima teratas untuk ${f.pct(R.rag.hit_at_5)} dari ${f.num(R.rag.n_pertanyaan_positif)} pertanyaan uji.`,
            `The assistant follows the Retrieval-Augmented Generation pattern (Lewis et al., 2020). Greetings and small talk are handled by a router. Other questions retrieve knowledge passages with BM25 and are answered by a Gemini model that must cite numbered sources and say it does not know when the context is thin. In the notebook, semantic retrieval found the right document first for ${f.pct(R.rag.hit_at_1)} and in the top five for ${f.pct(R.rag.hit_at_5)} of ${f.num(R.rag.n_pertanyaan_positif)} test questions.`,
          )}
        </p>

        <h2>{L('Kenali Rumah Adat', 'Recognising traditional houses')}</h2>
        <p>
          {L(
            `Model EfficientNet-B0 (Tan dan Le, 2019) dilatih dari foto berlisensi terbuka Wikimedia Commons untuk ${R.cv.kelas.length} jenis rumah adat, lalu diekspor ke ONNX (${f.dec(R.cv.ukuran_model_mb, 1)} MB) dan dijalankan langsung di peramban. Pada ${R.cv.n_uji} foto uji, akurasi top-1 ${f.pct(R.cv.akurasi_top1_uji)}, top-3 ${f.pct(R.cv.akurasi_top3_uji)}, dan F1 makro ${f.dec(R.cv.f1_makro_uji)}.`,
            `An EfficientNet-B0 model (Tan and Le, 2019) was trained on openly licensed Wikimedia Commons photos for ${R.cv.kelas.length} types of traditional houses, exported to ONNX (${f.dec(R.cv.ukuran_model_mb, 1)} MB), and runs directly in the browser. On ${R.cv.n_uji} test photos it reaches ${f.pct(R.cv.akurasi_top1_uji)} top-1 accuracy, ${f.pct(R.cv.akurasi_top3_uji)} top-3, and a macro F1 of ${f.dec(R.cv.f1_makro_uji)}.`,
          )}
        </p>
        <BarsFigure
          data={G.cvF1.map((c) => ({ label: c.kelas, value: c.f1, display: f.dec(c.f1), tone: c.f1 >= 0.75 ? 'kunyit' : 'tarum' }))}
          title={L('Skor F1 per jenis rumah adat', 'F1 score by house type')}
          caption={L(
            'F1 menggabungkan ketepatan dan kelengkapan tebakan; 1 berarti sempurna. Tongkonan dan Rumah Gadang paling mudah dikenali. Honai paling sulit karena fotonya paling sedikit. Kelas Lamin dinonaktifkan karena data latihnya tercampur foto yang tidak relevan.',
            'F1 combines precision and recall; 1 is perfect. Tongkonan and Rumah Gadang are the easiest to recognise. Honai is hardest because it has the fewest photos. The Lamin class is disabled because its training data was mixed with unrelated photos.',
          )}
        />

        <h2>{L('Penjaga Kepekaan Budaya', 'Cultural Sensitivity Guard')}</h2>
        <p>
          {L(
            `Warisan di domain adat istiadat, ritus, dan perayaan, juga warisan yang namanya memuat kata seperti upacara, ritual, sakral, atau pengobatan, diberi status perlu persetujuan (${f.pct(R.perluPersetujuan)} dari semua warisan). Warisan ini tetap bisa dipelajari, tetapi tidak pernah disarankan sebagai objek wisata sampai komunitas atau pemerintah daerah setuju.`,
            `Items in the customs, rites, and festivals domain, and items whose names include words such as ceremony, ritual, sacred, or healing, are marked as needing consent (${f.pct(R.perluPersetujuan)} of all items). They can still be learned about, but are never suggested as travel attractions until the community or local government agrees.`,
          )}
        </p>

        <h2>{L('Sumber data', 'Data sources')}</h2>
        <div className="tabel-wadah">
          <table>
            <thead>
              <tr>
                <th>{L('Data', 'Dataset')}</th>
                <th>{L('Lisensi', 'Licence')}</th>
                <th className="angka">{L('Baris', 'Rows')}</th>
                <th>{L('Catatan', 'Notes')}</th>
              </tr>
            </thead>
            <tbody>
              {MANIFEST.map((m) => (
                <tr key={m.dataset}>
                  <td>{m.url.startsWith('http') ? <a href={m.url}>{m.dataset}</a> : m.dataset}</td>
                  <td>{m.lisensi}</td>
                  <td className="angka">{m.jumlah_baris !== null ? f.num(m.jumlah_baris) : '-'}</td>
                  <td>{m.catatan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>{L('Yang belum bisa kami ukur', 'What we cannot measure yet')}</h2>
        <ul>
          <li>
            {L(
              `Data mencakup ${f.num(R.n)} dari ${f.num(R.nResmi)} WBTbI resmi. Penetapan 2024 dan 2025 belum tercantum di daftar Wikipedia yang menjadi sumber.`,
              `The data covers ${f.num(R.n)} of ${f.num(R.nResmi)} official items. The 2024 and 2025 designations are not yet in the Wikipedia list we use.`,
            )}
          </li>
          <li>{L('Wikipedia bukan sumber primer. Sampelnya dicek silang dengan situs resmi Kementerian Kebudayaan.', 'Wikipedia is not a primary source. Samples were cross-checked against the Ministry of Culture’s official site.')}</li>
          <li>{L('Tidak punya artikel berarti sulit ditemukan di internet, bukan berarti tidak dikenal masyarakatnya.', 'Having no article means hard to find online, not unknown to its own community.')}</li>
          <li>
            {L(
              'Arus wisata memakai perjalanan wisatawan nusantara, karena kunjungan wisatawan mancanegara per provinsi tidak tersedia sebagai data terbuka.',
              'Tourist flow uses domestic trips because foreign arrivals by province are not available as open data.',
            )}
          </li>
          {dki && <li>{L('Batas wilayah DKI Jakarta di peta berupa perkiraan.', 'The DKI Jakarta boundary on the map is approximate.')}</li>}
          <li>
            {L(
              'Rekomendasi dievaluasi dengan pelancong simulasi. Uji dengan pengguna nyata dan pemerintah daerah sedang kami rencanakan.',
              'Recommendations were evaluated with simulated travellers. Tests with real users and local governments are planned.',
            )}
          </li>
        </ul>

        <h2>{L('Rujukan', 'References')}</h2>
        <ol className="rujukan">
          {RUJUKAN.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </div>
    </>
  );
}
