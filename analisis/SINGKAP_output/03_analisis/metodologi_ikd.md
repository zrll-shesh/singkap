# Metodologi Indeks Ketakterlihatan Digital (IKD)

Rumus: IKD = K x (1 - V) x (1 - A). Rumus ini adalah rancangan tim SINGKAP; setiap tahap penyusunannya mengikuti kerangka baku penyusunan indeks komposit (OECD dan JRC, 2008).

Komponen K: n_wbtbi, entropi_domain, n_museum, n_situs. Komponen V: v_artikel_id, v_artikel_en, v_wikidata, v_gambar, v_pageviews, v_panjang. Komponen A: manual.

Bobot PCA V: {'v_artikel_id': 0.181, 'v_artikel_en': 0.115, 'v_wikidata': 0.166, 'v_gambar': 0.15, 'v_pageviews': 0.203, 'v_panjang': 0.185}. Bobot PCA K: {'k_n_wbtbi': 0.27, 'k_entropi_domain': 0.098, 'k_n_museum': 0.32, 'k_n_situs': 0.312}.

## Rujukan

- **Indeks komposit.** OECD dan JRC (2008). Handbook on Constructing Composite Indicators: Methodology and User Guide. OECD Publishing, Paris.
- **Agregasi geometrik.** UNDP (2010 dan seterusnya). Human Development Report, Technical Notes: Indeks Pembangunan Manusia memakai rata-rata geometrik.
- **Entropi.** Shannon, C. E. (1948). A Mathematical Theory of Communication. Bell System Technical Journal, 27, 379-423.
- **Ketimpangan.** Gini, C. (1912). Variabilita e mutabilita. Lorenz, M. O. (1905). Methods of measuring the concentration of wealth. JASA, 9(70).
- **Visibilitas Wikipedia dan pariwisata.** Wikipedia visibility and Instagram hashtag intensity in urban tourism: an AI-based multilingual analysis of tourist attractions in Seville (2026). Information Technology and Tourism. https://link.springer.com/article/10.1007/s40558-026-00419-6
- **Ketimpangan visibilitas daerah.** Analysis of the dissemination pathways for the influence of intangible cultural tourism empowered by spatio-temporal graph neural networks (2026). Discover Artificial Intelligence. https://link.springer.com/article/10.1007/s44163-026-01272-6
- **Keadilan eksposur.** Singh, A. dan Joachims, T. (2018). Fairness of Exposure in Rankings. Proceedings of KDD 2018.
- **Keberagaman daftar.** Carbonell, J. dan Goldstein, J. (1998). The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries. Proceedings of SIGIR 1998.
- **NDCG.** Jarvelin, K. dan Kekalainen, J. (2002). Cumulated gain-based evaluation of IR techniques. ACM Transactions on Information Systems, 20(4).
- **RAG.** Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS 2020.
- **Embedding.** Wang, L. et al. (2024). Multilingual E5 Text Embeddings: A Technical Report. arXiv:2402.05672.
- **Computer vision.** Tan, M. dan Le, Q. (2019). EfficientNet: Rethinking Model Scaling for CNNs. ICML 2019. Howard, A. et al. (2019). Searching for MobileNetV3. ICCV 2019.
- **Unsur kebudayaan.** Koentjaraningrat. Pengantar Ilmu Antropologi. Jakarta: Rineka Cipta.
- **Data WBTbI.** Wikipedia bahasa Indonesia, Daftar Warisan Budaya Takbenda Indonesia (CC BY-SA 4.0); angka resmi penetapan dari Kementerian Kebudayaan melalui pemberitaan detikTravel, Metro TV News, dan Direktorat Pelindungan Kebudayaan.