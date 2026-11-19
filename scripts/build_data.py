"""Menyiapkan data web SINGKAP dari folder SINGKAP_output hasil notebook.

Pemakaian:
    python scripts/build_data.py /path/ke/SINGKAP_output

Skrip ini:
1. Membaca ulang tabel WBTbI dengan dukungan rowspan sehingga domain setiap warisan terisi.
2. Menambahkan dimensi arus wisata (A) dari data resmi BPS 2025.
3. Menghitung ulang IKD, tipologi, temuan, dan konfigurasi rekomendasi.
4. Membangun knowledge base Tanya Singkap.
5. Menyalin model, gambar, dan berkas pendukung ke folder web.
"""
import json
import math
import re
import shutil
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd
from bs4 import BeautifulSoup
from scipy import stats

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else 'SINGKAP_output')
WEB = Path(__file__).resolve().parents[1]
DATA = WEB / 'data'
PUB = WEB / 'public'
for p in [DATA, PUB / 'data', PUB / 'models', PUB / 'figures']:
    p.mkdir(parents=True, exist_ok=True)

SEED = 42
NDCG_MIN = 0.90

PROV34 = ['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung',
          'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta',
          'Jawa Timur', 'Banten', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
          'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara',
          'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat', 'Maluku',
          'Maluku Utara', 'Papua Barat', 'Papua']

# Jumlah perjalanan wisatawan nusantara menurut provinsi tujuan, Januari sampai Desember 2025.
# Sumber: Badan Pusat Statistik, diolah kembali oleh Biro Data dan Sistem Informasi, Kementerian Pariwisata.
A_SOURCE = ('BPS, Jumlah Perjalanan Wisatawan Nusantara Menurut Provinsi Tujuan Jan-Des 2025, diolah Kementerian Pariwisata. '
            'https://api.kemenpar.go.id/storage/app/uploads/public/698/17a/433/69817a433f1bf883437057.pdf')
WISNUS_2025 = {
    'Aceh': 20096350, 'Sumatera Utara': 56910262, 'Sumatera Barat': 22302808, 'Riau': 23926171, 'Jambi': 10877483,
    'Sumatera Selatan': 26065516, 'Bengkulu': 7211781, 'Lampung': 27090780, 'Kepulauan Bangka Belitung': 4511219,
    'Kepulauan Riau': 4294670, 'DKI Jakarta': 99396992, 'Jawa Barat': 211762921, 'Jawa Tengah': 146253837,
    'DI Yogyakarta': 40592837, 'Jawa Timur': 217197652, 'Banten': 62556582, 'Bali': 26615306,
    'Nusa Tenggara Barat': 14848407, 'Nusa Tenggara Timur': 10401869, 'Kalimantan Barat': 13192118,
    'Kalimantan Tengah': 11298337, 'Kalimantan Selatan': 19017247, 'Kalimantan Timur': 15683381,
    'Kalimantan Utara': 1698620, 'Sulawesi Utara': 14537959, 'Sulawesi Tengah': 11572179, 'Sulawesi Selatan': 42530358,
    'Sulawesi Tenggara': 13272738, 'Gorontalo': 5280383, 'Sulawesi Barat': 4630996, 'Maluku': 3604744,
    'Maluku Utara': 3531781,
    'Papua Barat': 900522 + 1689495,                          # Papua Barat + Papua Barat Daya
    'Papua': 2855407 + 379854 + 905084 + 837913,              # Papua + Papua Selatan + Papua Tengah + Papua Pegunungan
}
JAKARTA_BOX = (106.68, -6.38, 106.98, -6.08)

DOMAIN_LABEL = {
    'ADAT_RITUS': 'Adat Istiadat Masyarakat, Ritus, dan Perayaan',
    'KERAJINAN': 'Kemahiran dan Kerajinan Tradisional',
    'PENGETAHUAN_ALAM': 'Pengetahuan dan Kebiasaan Perilaku Mengenai Alam dan Semesta',
    'PERTUNJUKAN': 'Seni Pertunjukan',
    'LISAN': 'Tradisi dan Ekspresi Lisan',
}
DOMAIN_SHORT = {'ADAT_RITUS': 'Adat dan ritus', 'KERAJINAN': 'Kerajinan', 'PENGETAHUAN_ALAM': 'Pengetahuan alam',
                'PERTUNJUKAN': 'Seni pertunjukan', 'LISAN': 'Tradisi lisan'}
UNSUR = {
    'LISAN': ['Bahasa', 'Kesenian'], 'PERTUNJUKAN': ['Kesenian'], 'ADAT_RITUS': ['Sistem religi', 'Organisasi sosial'],
    'PENGETAHUAN_ALAM': ['Sistem pengetahuan', 'Sistem mata pencaharian'],
    'KERAJINAN': ['Sistem peralatan hidup dan teknologi', 'Sistem mata pencaharian'],
}
SENSITIVE_RE = re.compile(r'\b(upacara|ritual|ritus|sakral|kematian|pemakaman|ruwatan|sesaji|sesajen|labuh|labuhan|'
                          r'pengobatan|mantra|jamasan|ngaben|kesurupan|tolak bala|tulak bala)\b', re.I)

INTEREST_KEYWORDS = {
    'Tari tradisional': ['tari', 'tarian', 'joget', 'zapin', 'saman', 'tor tor', 'tortor'],
    'Musik dan alat musik': ['musik', 'gendang', 'gamelan', 'angklung', 'sasando', 'kolintang', 'rebab', 'suling', 'seruling',
                             'gong', 'kecapi', 'talempong', 'tifa', 'gordang', 'rapai', 'tabuh', 'kulintang', 'sape', 'kacapi'],
    'Kuliner khas': ['nasi', 'sate', 'soto', 'rendang', 'gulai', 'sambal', 'ikan', 'pindang', 'pempek', 'papeda', 'coto',
                     'sop', 'kari', 'mie', 'lontong', 'ketupat', 'gudeg', 'masakan', 'kuliner', 'ayam', 'bubur'],
    'Kue dan jajanan': ['kue', 'jajan', 'dodol', 'lemang', 'wajik', 'lapis', 'bolu', 'onde', 'klepon', 'apem', 'bika', 'putu',
                        'serabi', 'kerupuk', 'kemplang', 'bakpia', 'lepet', 'lemper'],
    'Minuman tradisional': ['minuman', 'kopi', 'teh', 'wedang', 'tuak', 'bandrek', 'bajigur', 'sarabba', 'sirup', 'jamu'],
    'Kain tenun dan songket': ['tenun', 'songket', 'ulos', 'tapis', 'sasirangan', 'ikat', 'lurik', 'gringsing', 'kain', 'sarung'],
    'Batik': ['batik'],
    'Anyaman': ['anyam', 'anyaman', 'tikar', 'noken', 'bakul', 'rotan', 'pandan', 'tudung'],
    'Ukiran dan topeng': ['ukir', 'ukiran', 'pahat', 'patung', 'topeng'],
    'Permainan rakyat': ['permainan', 'gasing', 'egrang', 'congklak', 'layang', 'benteng', 'gobak', 'pacu', 'balap'],
    'Cerita rakyat dan legenda': ['cerita', 'legenda', 'hikayat', 'kaba', 'dongeng', 'mitos', 'kisah'],
    'Pantun, syair, dan sastra lisan': ['pantun', 'syair', 'gurindam', 'tembang', 'sastra', 'pupuh', 'macapat', 'dendang',
                                        'bakaba', 'mamanda', 'pepatah'],
    'Arsitektur rumah adat': ['rumah', 'arsitektur', 'balai', 'lamin', 'honai', 'joglo', 'tongkonan', 'betang', 'limas',
                              'gadang', 'bolon', 'rumoh', 'lumbung'],
    'Bela diri tradisional': ['silat', 'pencak', 'kuntau', 'sendeng', 'mancak', 'caci', 'peresean', 'bela diri'],
    'Teater rakyat': ['teater', 'lenong', 'ludruk', 'ketoprak', 'mamanda', 'randai', 'makyong', 'mak yong', 'dulmuluk',
                      'longser', 'drama'],
    'Wayang': ['wayang'],
    'Bertani dan berkebun tradisional': ['tani', 'sawah', 'padi', 'subak', 'ladang', 'bercocok', 'huma', 'tanam', 'panen'],
    'Perahu dan budaya bahari': ['perahu', 'kapal', 'pinisi', 'sampan', 'jong', 'laut', 'nelayan', 'bahari', 'pelaut', 'sandeq'],
    'Pakaian adat': ['pakaian', 'busana', 'baju', 'kebaya', 'sanggul', 'destar', 'tanjak', 'kopiah', 'mahkota', 'siger'],
    'Lagu daerah': ['lagu', 'nyanyian', 'senandung', 'kidung', 'dendang', 'nyanyi'],
    'Senjata tradisional': ['keris', 'rencong', 'badik', 'mandau', 'kujang', 'golok', 'tombak', 'parang', 'senjata',
                            'klewang', 'pedang', 'celurit', 'sumpit'],
    'Bahasa dan aksara': ['bahasa', 'aksara', 'huruf', 'dialek'],
    'Kearifan menjaga alam': ['hutan', 'sasi', 'lubuk', 'larangan', 'kearifan', 'alam', 'sungai', 'mata air'],
    'Perhiasan dan logam': ['perak', 'emas', 'logam', 'perhiasan', 'kuningan', 'tembaga', 'besi', 'gerabah', 'tembikar'],
}


INTEREST_EN = {
    'Tari tradisional': 'Traditional dance', 'Musik dan alat musik': 'Music and instruments', 'Kuliner khas': 'Regional cuisine',
    'Kue dan jajanan': 'Cakes and snacks', 'Minuman tradisional': 'Traditional drinks', 'Kain tenun dan songket': 'Woven cloth and songket',
    'Batik': 'Batik', 'Anyaman': 'Weaving and plaiting', 'Ukiran dan topeng': 'Carving and masks', 'Permainan rakyat': 'Folk games',
    'Cerita rakyat dan legenda': 'Folk tales and legends', 'Pantun, syair, dan sastra lisan': 'Pantun, poetry, and oral literature',
    'Arsitektur rumah adat': 'Traditional architecture', 'Bela diri tradisional': 'Martial arts', 'Teater rakyat': 'Folk theatre',
    'Wayang': 'Wayang puppetry', 'Bertani dan berkebun tradisional': 'Traditional farming', 'Perahu dan budaya bahari': 'Boats and maritime life',
    'Pakaian adat': 'Traditional dress', 'Lagu daerah': 'Regional songs', 'Senjata tradisional': 'Traditional weapons',
    'Bahasa dan aksara': 'Languages and scripts', 'Kearifan menjaga alam': 'Caring for nature', 'Perhiasan dan logam': 'Jewellery and metalwork',
}


def norm(s):
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9]+', ' ', s)).strip()


def pct_rank(s, zero_is_zero=True):
    s = pd.Series(s, dtype=float)
    if s.nunique(dropna=True) <= 1:
        return pd.Series(np.where(s > 0, 1.0, 0.0), index=s.index)
    r = s.rank(method='average', pct=True)
    if zero_is_zero:
        r[s <= 0] = 0.0
    return r.fillna(0.0)


def gini(x):
    x = np.sort(np.asarray(x, dtype=float))
    if x.sum() == 0:
        return 0.0
    n = len(x)
    return float((2 * np.arange(1, n + 1) - n - 1).dot(x) / (n * x.sum()))


def fmt_pct(x, d=1):
    return f'{x * 100:.{d}f}%'.replace('.', ',')


def fmt_dec(x, d=2):
    return f'{x:.{d}f}'.replace('.', ',')


def fmt_num(x):
    return f'{int(round(x)):,}'.replace(',', '.')


# 1. Domain dengan dukungan rowspan
def table_grid(table):
    grid, spans = [], {}
    for tr in table.find_all('tr'):
        cells = tr.find_all(['td', 'th'], recursive=False)
        row, ci, col = {}, 0, 0
        while ci < len(cells) or any(k >= col for k in spans):
            if col in spans:
                left, cell = spans[col]
                row[col] = cell
                if left <= 1:
                    del spans[col]
                else:
                    spans[col] = (left - 1, cell)
                col += 1
                continue
            if ci >= len(cells):
                col += 1
                if col > 20:
                    break
                continue
            c = cells[ci]
            ci += 1
            rs, cs = int(c.get('rowspan', 1) or 1), int(c.get('colspan', 1) or 1)
            for _ in range(cs):
                row[col] = c
                if rs > 1:
                    spans[col] = (rs - 1, c)
                col += 1
        grid.append([row[k] for k in sorted(row)])
    return grid


def domain_code(text):
    k = norm(text)
    if 'pertunjukan' in k:
        return 'PERTUNJUKAN'
    if 'lisan' in k:
        return 'LISAN'
    if 'kemahiran' in k or 'kerajinan' in k or 'keterampilan' in k:
        return 'KERAJINAN'
    if 'pengetahuan' in k or 'semesta' in k:
        return 'PENGETAHUAN_ALAM'
    if 'adat' in k or 'ritus' in k or 'perayaan' in k:
        return 'ADAT_RITUS'
    return None


def domains_from_html(path):
    soup = BeautifulSoup(path.read_text(encoding='utf-8'), 'lxml')
    found = {}
    for table in soup.find_all('table'):
        if table.find_parent('table') is not None:
            continue
        grid = table_grid(table)
        if not grid:
            continue
        head = [re.sub(r'[^a-z ]+', ' ', c.get_text(' ').lower()).strip() for c in grid[0]]
        dom_i = next((i for i, h in enumerate(head) if 'domain' in h), None)
        for row in grid[1:]:
            texts = [c.get_text(' ', strip=True) for c in row]
            reg = next((t for t in texts if re.fullmatch(r'20[1-3]\d{6}', t)), None)
            if not reg:
                continue
            cand = [texts[dom_i]] if dom_i is not None and dom_i < len(texts) else texts
            code = next((domain_code(t) for t in cand if domain_code(t)), None)
            if code:
                found[reg] = code
    return found


item = pd.read_csv(SRC / '03_analisis/ikd_item.csv', dtype={'no_registrasi': str})
before = item['domain'].notna().mean()
fixed = domains_from_html(SRC / '01_data_mentah/wbtbi_wikipedia.html')
item['domain'] = item['domain'].fillna(item['no_registrasi'].map(fixed))
item['domain_label'] = item['domain'].map(DOMAIN_LABEL).fillna('Tidak terklasifikasi')
item['unsur_kebudayaan'] = item['domain'].map(lambda d: ', '.join(UNSUR.get(d, [])) if isinstance(d, str) else '')
print(f'Domain terklasifikasi: {fmt_pct(before)} menjadi {fmt_pct(item["domain"].notna().mean())}')


def sensitivity(dcode, name):
    reasons = []
    if dcode == 'ADAT_RITUS':
        reasons.append('domain adat istiadat, ritus, dan perayaan')
    m = SENSITIVE_RE.search(str(name))
    if m:
        reasons.append(f'kata kunci "{m.group(0).lower()}"')
    return ('perlu_persetujuan' if reasons else 'terbuka'), '; '.join(reasons)


sens = [sensitivity(d, n) for d, n in zip(item['domain'], item['nama'])]
item['kepekaan'] = [s[0] for s in sens]
item['alasan_kepekaan'] = [s[1] for s in sens]

# 2. Dimensi daerah dan IKD
pts = pd.read_csv(SRC / '02_data_olahan/titik_warisan.csv')
in_jkt = pts['provinsi'].isna() & pts['lon'].between(JAKARTA_BOX[0], JAKARTA_BOX[2]) & pts['lat'].between(JAKARTA_BOX[1], JAKARTA_BOX[3])
pts.loc[in_jkt, 'provinsi'] = 'DKI Jakarta'
print(f'Titik yang dipetakan ulang ke DKI Jakarta: {int(in_jkt.sum())}')

V_COMP = ['v_artikel_id', 'v_artikel_en', 'v_wikidata', 'v_gambar', 'v_pageviews', 'v_panjang']
reg = pd.DataFrame({'provinsi': PROV34})
inp = item[item['provinsi'].isin(PROV34)]
reg['n_wbtbi'] = reg['provinsi'].map(inp.groupby('provinsi').size()).fillna(0).astype(int)
dc = inp.pivot_table(index='provinsi', columns='domain', values='id', aggfunc='count', fill_value=0)


def entropy_norm(row):
    p = np.asarray(row, dtype=float)
    p = p[p > 0] / p.sum() if p.sum() else p
    return float(-(p * np.log(p)).sum() / np.log(5)) if len(p) else 0.0


reg['entropi_domain'] = reg['provinsi'].map(lambda p: entropy_norm(dc.loc[p]) if p in dc.index else 0.0)
reg['n_museum'] = reg['provinsi'].map(pts[pts['jenis'] == 'museum'].groupby('provinsi').size()).fillna(0)
reg['n_situs'] = reg['provinsi'].map(pts[pts['jenis'] == 'situs_warisan'].groupby('provinsi').size()).fillna(0)
K_COMP = ['n_wbtbi', 'entropi_domain', 'n_museum', 'n_situs']
for c in K_COMP:
    reg[f'k_{c}'] = pct_rank(reg[c])
reg['K'] = reg[[f'k_{c}' for c in K_COMP]].mean(axis=1)
reg['V'] = reg['provinsi'].map(inp.groupby('provinsi')['V'].mean()).fillna(0)
reg['arus_wisata'] = reg['provinsi'].map(WISNUS_2025)
# Peringkat persentil titik tengah: provinsi teramai tidak otomatis bernilai A = 1 sehingga IKD-nya tidak dipaksa nol
reg['A'] = (reg['arus_wisata'].rank(method='average') - 0.5) / len(reg)
reg['IKD'] = reg['K'] * (1 - reg['V']) * (1 - reg['A'])
reg['peringkat_ikd'] = reg['IKD'].rank(ascending=False, method='min').astype(int)
reg['pct_tanpa_artikel'] = reg['provinsi'].map(1 - inp.groupby('provinsi')['ada_artikel_id'].mean())
med_K, med_V = reg['K'].median(), reg['V'].median()


def tipologi(k, v):
    if k >= med_K and v < med_V:
        return 'Kaya namun tersembunyi'
    if k >= med_K:
        return 'Kaya dan terlihat'
    if v < med_V:
        return 'Perlu pendataan lebih lanjut'
    return 'Terlihat dengan kekayaan terbatas'


reg['tipologi'] = [tipologi(k, v) for k, v in zip(reg['K'], reg['V'])]
item['K'] = item['provinsi'].map(reg.set_index('provinsi')['K'])
item['A'] = item['provinsi'].map(reg.set_index('provinsi')['A'])
item['IKD'] = item['K'] * (1 - item['V']) * (1 - item['A'])
item['peringkat_ikd'] = item['IKD'].rank(ascending=False, method='min')
N_RANKED = int(item['IKD'].notna().sum())

# Uji ketahanan
variants = pd.DataFrame({'dasar': reg['IKD'], 'aditif': (reg['K'] + (1 - reg['V']) + (1 - reg['A'])) / 3,
                         'tanpa_A': reg['K'] * (1 - reg['V'])})
rho = variants.corr(method='spearman')
abl = []
top_base = set(item.nlargest(100, 'IKD')['id'])
for c in V_COMP:
    alt = item['K'] * (1 - item[[x for x in V_COMP if x != c]].mean(axis=1)) * (1 - item['A'])
    abl.append((stats.spearmanr(item['IKD'], alt, nan_policy='omit')[0],
                len(top_base & set(item.assign(_a=alt).nlargest(100, '_a')['id'])) / 100))
ROBUST = {'spearman_dasar_vs_aditif': float(rho.loc['dasar', 'aditif']),
          'spearman_dasar_vs_tanpa_A': float(rho.loc['dasar', 'tanpa_A']),
          'spearman_ablasi_min': float(min(a for a, _ in abl)), 'irisan_top100_min': float(min(b for _, b in abl))}

# 3. Rekomendasi: prototipe minat dari embedding warisan
emb = np.load(SRC / '06_rekomendasi/item_embeddings.npy').astype('float32')
ids = json.load(open(SRC / '06_rekomendasi/item_ids.json'))
emb_idx = {i: k for k, i in enumerate(ids)}
item['emb_row'] = item['id'].map(emb_idx)
cand = item[(item['kepekaan'] == 'terbuka') & item['provinsi'].isin(PROV34) & item['IKD'].notna() & item['emb_row'].notna()].copy()
cand = cand.reset_index(drop=True)
E = emb[cand['emb_row'].astype(int).to_numpy()]
E /= np.linalg.norm(E, axis=1, keepdims=True) + 1e-9
all_E = emb / (np.linalg.norm(emb, axis=1, keepdims=True) + 1e-9)
names_norm = item['nama'].map(norm)
interests, sims = [], []
for label, kws in INTEREST_KEYWORDS.items():
    pat = re.compile(r'\b(?:' + '|'.join(re.escape(norm(k)) for k in kws) + r')')
    proto = item[names_norm.str.contains(pat) & item['emb_row'].notna()]
    if len(proto) < 3:
        print(f'Minat dilewati (prototipe < 3): {label}')
        continue
    c = all_E[proto['emb_row'].astype(int)].mean(axis=0)
    c /= np.linalg.norm(c)
    s = E @ c
    s = (s - s.min()) / (s.max() - s.min() + 1e-9)
    interests.append({'label': label, 'label_en': INTEREST_EN.get(label, label), 'n_prototipe': int(len(proto))})
    sims.append(np.round(s * 255).astype(int))
print(f'Minat aktif: {len(interests)}')

prov_list = PROV34
pidx = {p: i for i, p in enumerate(prov_list)}
cent = {r['provinsi']: (r['lat'], r['lon']) for r in json.load(open(SRC / '08_data_web/provinsi.json'))}
cent['DKI Jakarta'] = (-6.21, 106.85)
lat = np.radians([cent[p][0] for p in prov_list])
lon = np.radians([cent[p][1] for p in prov_list])
dlat, dlon = lat[:, None] - lat[None, :], lon[:, None] - lon[None, :]
DIST = 2 * 6371 * np.arcsin(np.sqrt(np.sin(dlat / 2) ** 2 + np.cos(lat[:, None]) * np.cos(lat[None, :]) * np.sin(dlon / 2) ** 2))
cand_p = cand['provinsi'].map(pidx).to_numpy()
ikd_n = pct_rank(cand['IKD'], zero_is_zero=False).to_numpy()
SIMS = np.array(sims, dtype=float) / 255.0
TOPK, POOL, SCALE = 10, 150, 800.0


def relevance(qi, dest):
    return SIMS[qi] * (0.5 + 0.5 * np.exp(-DIST[dest, cand_p] / SCALE))


def rerank(rel, lam, pen):
    base = lam * rel + (1 - lam) * ikd_n
    pool = np.argpartition(-base, POOL)[:POOL]
    sc, pp = base[pool].copy(), cand_p[pool]
    cnt, out = np.zeros(len(prov_list)), []
    for _ in range(TOPK):
        j = int(np.argmax(sc - pen * cnt[pp]))
        out.append(pool[j])
        cnt[pp[j]] += 1
        sc[j] = -np.inf
    return np.array(out)


def dcg(g):
    return float((g / np.log2(np.arange(2, len(g) + 2))).sum())


rng = np.random.default_rng(SEED)
users = [(int(rng.integers(len(interests))), int(rng.integers(len(prov_list)))) for _ in range(400)]
RELS = [relevance(q, d) for q, d in users]
vis5 = [pidx[p] for p in reg.nlargest(5, 'V')['provinsi']]


def evaluate(lam, pen):
    expo, nd, ik = np.zeros(len(prov_list)), [], []
    for rel in RELS:
        top = rerank(rel, lam, pen)
        nd.append(dcg(rel[top]) / dcg(np.sort(rel)[::-1][:TOPK]))
        ik.append(cand['IKD'].to_numpy()[top].mean())
        np.add.at(expo, cand_p[top], 1 / np.log2(np.arange(2, TOPK + 2)))
    return {'lambda': lam, 'penalti': pen, 'ndcg10': float(np.mean(nd)), 'gini': gini(expo),
            'ikd_rata2': float(np.mean(ik)), 'porsi_5_terlihat': float(expo[vis5].sum() / expo.sum()),
            'provinsi_terjangkau': int((expo > 0).sum())}


PEN = 0.12
base_eval = evaluate(1.0, 0.0)
grid = [evaluate(float(l), PEN) for l in np.round(np.linspace(1.0, 0.0, 21), 2) + 0.0]
ok = [g for g in grid if g['ndcg10'] >= NDCG_MIN and g['gini'] <= base_eval['gini'] + 0.01]
best = max(ok, key=lambda g: g['ikd_rata2']) if ok else base_eval
print(f"Lambda terpilih {best['lambda']}: NDCG {best['ndcg10']:.3f}, Gini {base_eval['gini']:.3f} -> {best['gini']:.3f}, "
      f"IKD {base_eval['ikd_rata2']:.3f} -> {best['ikd_rata2']:.3f}")

# 4. Temuan
ins_old = json.load(open(SRC / '03_analisis/insights.json'))
T_old = ins_old['statistik']
cls = item.dropna(subset=['domain'])
tab = pd.crosstab(cls['domain'], cls['ada_artikel_id'])
chi = stats.chi2_contingency(tab)
cv = float(np.sqrt(chi[0] / (tab.values.sum() * (min(tab.shape) - 1))))
dv = cls.groupby('domain')['ada_artikel_id'].mean().sort_values()
rkv = stats.spearmanr(reg['K'], reg['V'])
rav = stats.spearmanr(reg['A'], reg['V'])
top5 = reg.nsmallest(5, 'peringkat_ikd')['provinsi'].tolist()
kt = reg.loc[reg['tipologi'] == 'Kaya namun tersembunyi', 'provinsi'].tolist()
new, old = item[item['tahun'] >= 2023], item[item['tahun'] < 2023]
mw = stats.mannwhitneyu(new['V'], old['V'])[1]
sig = lambda p: 'signifikan secara statistik (p < 0,05)' if p < 0.05 else 'tidak signifikan secara statistik'
bali_rank = int(reg.set_index('provinsi').loc['Bali', 'peringkat_ikd'])
cvm = json.load(open(SRC / '05_model_cv/metrics.json'))
ragc = json.load(open(SRC / '07_rag/rag_config.json'))
DOMAIN_EN = {'ADAT_RITUS': 'Customs, rites, and festivals', 'KERAJINAN': 'Traditional craftsmanship',
             'PENGETAHUAN_ALAM': 'Knowledge about nature and the universe', 'PERTUNJUKAN': 'Performing arts',
             'LISAN': 'Oral traditions and expressions'}
sig_en = lambda p: 'statistically significant (p < 0.05)' if p < 0.05 else 'not statistically significant'
pe = lambda x, d=1: f'{x * 100:.{d}f}%'
R0, R1 = base_eval, best
tanpa_id, tanpa_en = 1 - item['ada_artikel_id'].mean(), 1 - item['ada_artikel_en'].mean()
INSIGHTS = [
    dict(id='ketakterlihatan', judul='Satu dari empat warisan belum punya artikel',
         teks=f"Dari {fmt_num(len(item))} WBTbI yang kami telusuri, {fmt_pct(tanpa_id)} belum punya artikel Wikipedia bahasa Indonesia "
              f"dan {fmt_pct(tanpa_en)} belum punya versi bahasa Inggris. Bagi pembaca dari luar negeri, sebagian besar warisan kita praktis tidak ada.",
         judul_en='One in four heritage items has no article',
         teks_en=f"Of the {len(item):,} designated items we traced, {pe(tanpa_id)} have no Indonesian Wikipedia article and {pe(tanpa_en)} "
                 'have no English version. For readers abroad, most of this heritage effectively does not exist.'),
    dict(id='ketimpangan_perhatian', judul='Perhatian menumpuk di segelintir warisan',
         teks=f"Sepuluh persen artikel teratas menyerap {fmt_pct(T_old['share_top10pct'])} seluruh kunjungan halaman dalam setahun. Median "
              f"kunjungan hanya {fmt_num(T_old['median_pv'])} per tahun, kurang dari satu pembaca per hari. Koefisien Gini {fmt_dec(T_old['gini_pageviews'])}.",
         judul_en='Attention piles up on a handful of items',
         teks_en=f"The top ten percent of articles receive {pe(T_old['share_top10pct'])} of all page views in a year. The median is only "
                 f"{int(T_old['median_pv']):,} views a year, less than one reader a day. Gini coefficient {T_old['gini_pageviews']:.2f}."),
    dict(id='domain', judul='Pengetahuan tentang alam paling jarang ditulis',
         teks=f"{DOMAIN_LABEL[dv.index[0]]} paling sering belum punya artikel ({fmt_pct(1 - dv.iloc[0])}), sedangkan "
              f"{DOMAIN_LABEL[dv.index[-1]].lower()} paling banyak ditulis ({fmt_pct(1 - dv.iloc[-1])}). Perbedaannya {sig(chi[1])}, "
              f"Cramér's V {fmt_dec(cv)}. Cara bertani, membaca musim, dan menjaga hutan lebih cepat hilang dari ingatan digital daripada tarian.",
         judul_en='Knowledge about nature is the least written',
         teks_en=f"Items on {DOMAIN_EN[dv.index[0]].lower()} most often lack an article ({pe(1 - dv.iloc[0])}), while {DOMAIN_EN[dv.index[-1]].lower()} are the "
                 f"most documented ({pe(1 - dv.iloc[-1])}). The difference is {sig_en(chi[1])}, Cramér's V {cv:.2f}. Farming, reading seasons, "
                 'and caring for forests fade from digital memory faster than dances do.'),
    dict(id='penetapan_baru', judul='Penetapan baru tertinggal secara digital',
         teks=f"Warisan yang ditetapkan pada 2023 {fmt_pct(1 - new['ada_artikel_id'].mean())} tanpa artikel, hampir dua kali lipat penetapan "
              f"sebelumnya ({fmt_pct(1 - old['ada_artikel_id'].mean())}). Perbedaannya {sig(mw)}. Status resmi belum otomatis berarti dikenal.",
         judul_en='New designations lag behind online',
         teks_en=f"Items designated in 2023 lack an article {pe(1 - new['ada_artikel_id'].mean())} of the time, nearly twice the rate of earlier "
                 f"designations ({pe(1 - old['ada_artikel_id'].mean())}). The gap is {sig_en(mw)}. Official status does not automatically mean recognition."),
    dict(id='kaya_tersembunyi', judul='Kaya budaya, sepi perhatian',
         teks=f"Setelah memperhitungkan arus wisatawan nusantara 2025, lima provinsi dengan IKD tertinggi adalah {', '.join(top5)}. "
              f"Bali, tujuan wisata paling terkenal, berada di peringkat {bali_rank}.",
         judul_en='Rich in culture, short on attention',
         teks_en=f"After accounting for 2025 domestic travel, the five provinces with the highest index are {', '.join(top5)}. "
                 f"Bali, the best-known destination, ranks {bali_rank}."),
    dict(id='kekayaan_visibilitas', judul='Perhatian digital mengikuti keramaian, bukan kekayaan',
         teks=f"Visibilitas digital provinsi berkorelasi dengan arus wisatawan (Spearman {fmt_dec(rav[0])}, {sig(rav[1])}), tetapi tidak dengan "
              f"kekayaan budayanya ({fmt_dec(rkv[0])}, {sig(rkv[1])}). Daerah yang ramai makin terlihat; daerah kaya belum tentu.",
         judul_en='Online attention follows crowds, not cultural wealth',
         teks_en=f"Provincial visibility correlates with tourist flow (Spearman {rav[0]:.2f}, {sig_en(rav[1])}) but not with cultural richness "
                 f"({rkv[0]:.2f}, {sig_en(rkv[1])}). Busy places become more visible; rich places do not necessarily."),
    dict(id='robust', judul='Peringkatnya tidak rapuh',
         teks=f"Mengganti cara agregasi menghasilkan korelasi peringkat {fmt_dec(ROBUST['spearman_dasar_vs_aditif'])}. Menghapus satu per satu "
              f"komponen visibilitas tetap memberi korelasi minimal {fmt_dec(ROBUST['spearman_ablasi_min'])} dengan irisan 100 teratas "
              f"{fmt_pct(ROBUST['irisan_top100_min'], 0)}.",
         judul_en='The ranking is not fragile',
         teks_en=f"Changing the aggregation keeps a rank correlation of {ROBUST['spearman_dasar_vs_aditif']:.2f}. Removing visibility components one "
                 f"at a time keeps at least {ROBUST['spearman_ablasi_min']:.2f}, with a top-100 overlap of {pe(ROBUST['irisan_top100_min'], 0)}."),
    dict(id='kepekaan', judul='Tidak semua warisan untuk ditonton',
         teks=f"{fmt_pct((item['kepekaan'] == 'perlu_persetujuan').mean())} warisan adalah ritus, upacara, atau pengetahuan yang peka. "
              'Semuanya ditahan dari rekomendasi wisata sampai komunitas atau pemerintah daerah memberi persetujuan.',
         judul_en='Not every heritage is a show',
         teks_en=f"{pe((item['kepekaan'] == 'perlu_persetujuan').mean())} of items are rites, ceremonies, or sensitive knowledge. They are held back "
                 'from travel recommendations until the community or local government agrees.'),
    dict(id='rekomendasi', judul='Menyingkap tanpa menciptakan keramaian baru',
         teks=f"Pada simulasi 400 pelancong, pengaturan Pemerataan λ = {fmt_dec(R1['lambda'])} menaikkan rata-rata IKD warisan yang disarankan dari "
              f"{fmt_dec(R0['ikd_rata2'], 3)} menjadi {fmt_dec(R1['ikd_rata2'], 3)} dan menurunkan porsi lima provinsi paling terlihat dari "
              f"{fmt_pct(R0['porsi_5_terlihat'])} menjadi {fmt_pct(R1['porsi_5_terlihat'])}, sambil mempertahankan {fmt_pct(R1['ndcg10'], 0)} relevansi.",
         judul_en='Revealing without creating new crowds',
         teks_en=f"Across 400 simulated travellers, a fairness setting of λ = {R1['lambda']:.2f} raises the average index of suggested items from "
                 f"{R0['ikd_rata2']:.3f} to {R1['ikd_rata2']:.3f} and cuts the share of the five most visible provinces from "
                 f"{pe(R0['porsi_5_terlihat'])} to {pe(R1['porsi_5_terlihat'])}, while keeping {pe(R1['ndcg10'], 0)} of relevance."),
    dict(id='cv', judul='Mengenali rumah adat dari satu foto',
         teks=f"Model kami mengenali {len(cvm['kelas'])} jenis rumah adat dengan tebakan pertama benar {fmt_pct(cvm['akurasi_top1_uji'])} dan jawaban "
              f"benar di tiga teratas {fmt_pct(cvm['akurasi_top3_uji'])} pada {cvm['n_uji']} foto uji. Semuanya berjalan di ponsel tanpa server.",
         judul_en='Recognising traditional houses from one photo',
         teks_en=f"Our model recognises {len(cvm['kelas'])} types of traditional houses, top-1 correct {pe(cvm['akurasi_top1_uji'])} and top-3 "
                 f"{pe(cvm['akurasi_top3_uji'])} on {cvm['n_uji']} test photos. It runs on the phone, without a server."),
    dict(id='rag', judul='Asisten yang tahu kapan harus bilang belum tahu',
         teks=f"Dari {ragc['evaluasi']['n_pertanyaan_positif']} pertanyaan uji, dokumen yang tepat ditemukan di lima teratas untuk "
              f"{fmt_pct(ragc['evaluasi']['hit_at_5'])} pertanyaan, dan pertanyaan di luar budaya tidak dijawab asal.",
         judul_en='An assistant that knows when to say it does not know',
         teks_en=f"Across {ragc['evaluasi']['n_pertanyaan_positif']} test questions, the right document appears in the top five "
                 f"{pe(ragc['evaluasi']['hit_at_5'])} of the time, and off-topic questions are declined rather than guessed."),
    dict(id='cakupan', judul='Yang belum bisa kami ukur',
         teks=f"Data mencakup {fmt_num(len(item))} dari 2.727 WBTbI resmi, yaitu penetapan 2013 sampai 2023. Penetapan 2024 dan 2025 belum ada di "
              'sumber terbuka. Arus wisata memakai perjalanan wisatawan nusantara 2025 dari BPS karena data wisatawan mancanegara per provinsi '
              'tidak tersedia terbuka.',
         judul_en='What we cannot measure yet',
         teks_en=f"The data covers {len(item):,} of 2,727 official items, designated 2013 to 2023. The 2024 and 2025 designations are not yet in "
                 'open sources. Tourist flow uses 2025 domestic trips from Statistics Indonesia because foreign arrivals by province are not openly available.'),
]

# 5. Knowledge base
docs_old = [json.loads(l) for l in open(SRC / '07_rag/kb_documents.jsonl', encoding='utf-8')]
KEEP = {'tentang', 'metodologi', 'konteks', 'ensiklopedia', 'rumah_adat'}
KB = [d for d in docs_old if d['jenis'] in KEEP and d['doc_id'] != 'metode_rekomendasi']
SRC_S = {'nama': 'Analisis tim SINGKAP', 'url': 'https://singkap.vercel.app/metodologi', 'lisensi': 'CC BY-SA 4.0'}
SRC_LIST = {'nama': 'Wikipedia: Daftar Warisan Budaya Takbenda Indonesia',
            'url': 'https://id.wikipedia.org/wiki/Daftar_Warisan_Budaya_Takbenda_Indonesia', 'lisensi': 'CC BY-SA 4.0'}
SRC_A = {'nama': 'BPS via Kementerian Pariwisata: perjalanan wisatawan nusantara 2025',
         'url': 'https://api.kemenpar.go.id/storage/app/uploads/public/698/17a/433/69817a433f1bf883437057.pdf', 'lisensi': 'data resmi'}


def add(doc_id, jenis, judul, teks, sumber, provinsi=None):
    KB.append({'doc_id': doc_id, 'jenis': jenis, 'judul': judul, 'teks': re.sub(r'\s+', ' ', teks).strip(),
               'sumber': sumber if isinstance(sumber, list) else [sumber], 'provinsi': provinsi})


add('metode_rekomendasi', 'metodologi', 'Rekomendasi wisata berkeadilan di Jalur Singkap',
    'Jalur Singkap mencocokkan minat pengguna dengan warisan memakai embedding multilingual-e5-small. Setiap minat diwakili prototipe, yaitu '
    'rata-rata embedding warisan yang namanya cocok dengan kata kunci minat tersebut. Relevansi dikalikan faktor kedekatan geografis ke '
    'tujuan perjalanan. Skor akhir = lambda x relevansi + (1 - lambda) x IKD, lalu daftar disusun dengan penalti untuk warisan dari provinsi '
    'yang sama. Lambda dipilih dengan syarat NDCG@10 minimal 0,90 dan Gini eksposur antarprovinsi tidak naik. Pengguna dapat menggeser '
    'pengaturan Pemerataan untuk mengubah lambda. Warisan berstatus perlu persetujuan tidak pernah direkomendasikan.', SRC_S)
add('metode_arus', 'metodologi', 'Data arus wisata (A) dalam IKD',
    'Dimensi arus wisata (A) memakai jumlah perjalanan wisatawan nusantara menurut provinsi tujuan Januari sampai Desember 2025 dari BPS, '
    'diolah Kementerian Pariwisata. Provinsi hasil pemekaran digabung ke induknya. Jawa Timur (217,2 juta perjalanan), Jawa Barat '
    '(211,8 juta), dan Jawa Tengah (146,3 juta) adalah tujuan terbanyak. Nilai dinormalisasi dengan peringkat persentil.', SRC_A)
add('glosarium', 'tentang', 'Glosarium istilah SINGKAP',
    'IKD adalah Indeks Ketakterlihatan Digital. WBTb adalah Warisan Budaya Takbenda. WBTbI adalah Warisan Budaya Takbenda Indonesia yang '
    'sudah ditetapkan pemerintah pusat. K adalah kekayaan budaya, V adalah visibilitas digital, A adalah arus wisata. Lambda adalah pengaturan '
    'Pemerataan di Jalur Singkap. NDCG@10 mengukur relevansi sepuluh rekomendasi teratas. Koefisien Gini mengukur ketimpangan, 0 merata dan '
    '1 sangat timpang. Penjaga Kepekaan Budaya adalah fitur yang menahan warisan sakral dari rekomendasi wisata.', SRC_S)
for x in INSIGHTS:
    add(f"temuan_{x['id']}", 'temuan', x['judul'], f"Temuan SINGKAP: {x['judul']}. {x['teks']}", SRC_S)
add('temuan_ringkasan', 'temuan', 'Ringkasan temuan utama SINGKAP',
    'Ringkasan temuan SINGKAP: ' + ' '.join(f"({i + 1}) {x['teks']}" for i, x in enumerate(INSIGHTS[:9])), SRC_S)

for _, r in reg.iterrows():
    p = r['provinsi']
    sub = item[item['provinsi'] == p]
    if sub.empty:
        continue
    hid = sub[sub['kepekaan'] == 'terbuka'].nsmallest(5, 'peringkat_ikd')['nama'].tolist()
    sen = sub[sub['kepekaan'] == 'perlu_persetujuan'].nsmallest(3, 'peringkat_ikd')['nama'].tolist()
    pop = sub.nlargest(3, 'pageviews_12b')['nama'].tolist()
    dom = sub['domain'].map(DOMAIN_SHORT).fillna('tidak terklasifikasi').value_counts()
    add(f'prov_{norm(p).replace(" ", "_")}', 'profil_provinsi', f'Profil SINGKAP Provinsi {p}',
        f"Profil SINGKAP Provinsi {p}. Jumlah WBTbI dalam data: {len(sub)}. Komposisi domain: "
        + '; '.join(f'{k} {v}' for k, v in dom.items())
        + f". Tanpa artikel Wikipedia bahasa Indonesia: {fmt_pct(r['pct_tanpa_artikel'])}. Kekayaan budaya (K) {fmt_dec(r['K'])}, "
          f"visibilitas digital (V) {fmt_dec(r['V'])}, arus wisata (A) {fmt_dec(r['A'])} dari {fmt_num(r['arus_wisata'])} perjalanan "
          f"wisatawan nusantara 2025. IKD {fmt_dec(r['IKD'], 3)}, peringkat {int(r['peringkat_ikd'])} dari 34 provinsi. Tipologi: "
          f"{r['tipologi']}. Museum terpetakan {int(r['n_museum'])}, situs warisan terpetakan {int(r['n_situs'])}. Warisan paling "
          f"tersembunyi yang terbuka untuk dikunjungi: {', '.join(hid) or 'belum ada'}. Warisan yang perlu persetujuan komunitas: "
          f"{', '.join(sen) or 'tidak ada'}. Warisan yang paling sering dibaca: {', '.join(pop)}.", [SRC_S, SRC_A], p)

for code, label in DOMAIN_LABEL.items():
    sub = item[item['domain'] == code]
    add(f'domain_{code.lower()}', 'profil_domain', f'Profil domain {label}',
        f"Profil domain {label}. Jumlah WBTbI: {len(sub)}. Unsur kebudayaan: {', '.join(UNSUR[code])}. Tanpa artikel bahasa Indonesia: "
        f"{fmt_pct(1 - sub['ada_artikel_id'].mean())}; tanpa artikel bahasa Inggris: {fmt_pct(1 - sub['ada_artikel_en'].mean())}. "
        f"Provinsi terbanyak: {', '.join(sub['provinsi'].value_counts().head(3).index)}. Contoh paling tersembunyi: "
        f"{', '.join(sub.nsmallest(5, 'peringkat_ikd')['nama'])}.", SRC_S)

top100 = item.dropna(subset=['IKD']).nsmallest(100, 'peringkat_ikd')
for k in range(5):
    part = top100.iloc[k * 20:(k + 1) * 20]
    add(f'top100_{k}', 'daftar_tersembunyi', f'Warisan paling tersembunyi peringkat {k * 20 + 1} sampai {k * 20 + len(part)}',
        f'Daftar warisan paling tersembunyi menurut IKD, peringkat {k * 20 + 1} sampai {k * 20 + len(part)}: '
        + '; '.join(f"{k * 20 + j + 1}. {r['nama']} ({r['provinsi']}" + (', perlu persetujuan' if r['kepekaan'] == 'perlu_persetujuan' else '') + ')'
                    for j, (_, r) in enumerate(part.iterrows())), SRC_S)

old_text = {d['doc_id']: d['teks'] for d in docs_old if d['jenis'] == 'warisan'}
for _, r in item.iterrows():
    ringkasan = ''
    t = old_text.get(r['id'], '')
    m = re.search(r'(terbuka untuk direkomendasikan|sebelum dipromosikan sebagai objek wisata)\. (.*)$', t)
    if m:
        ringkasan = m.group(2)
    art = r['ada_artikel_id'] is True or str(r['ada_artikel_id']).lower() == 'true'
    en = str(r['ada_artikel_en']).lower() == 'true'
    status = (('memiliki artikel Wikipedia bahasa Indonesia' + (' dan bahasa Inggris' if en else ', belum ada versi bahasa Inggris'))
              if art else 'belum memiliki artikel Wikipedia')
    kep = ('perlu persetujuan pemerintah daerah atau komunitas sebelum dipromosikan sebagai objek wisata'
           if r['kepekaan'] == 'perlu_persetujuan' else 'terbuka untuk direkomendasikan')
    ikd_txt = (f"IKD {fmt_dec(r['IKD'], 3)}, peringkat {int(r['peringkat_ikd'])} dari {N_RANKED} (peringkat 1 paling tersembunyi)"
               if pd.notna(r['IKD']) else 'IKD tidak dihitung')
    src = [SRC_LIST]
    if art and isinstance(r['judul_artikel'], str):
        src.append({'nama': f"Wikipedia: {r['judul_artikel']}", 'url': 'https://id.wikipedia.org/wiki/' + r['judul_artikel'].replace(' ', '_'),
                    'lisensi': 'CC BY-SA 4.0'})
    add(r['id'], 'warisan', r['nama'],
        f"{r['nama']} adalah Warisan Budaya Takbenda Indonesia dari {r['provinsi']}, ditetapkan tahun {r['tahun']} dengan nomor registrasi "
        f"{r['no_registrasi']}. Domain: {r['domain_label']}. Unsur kebudayaan: {r['unsur_kebudayaan'] or 'belum terklasifikasi'}. "
        f"Status digital: {status}; kunjungan halaman 12 bulan terakhir {fmt_num(r['pageviews_12b'])}. {ikd_txt}. Status kepekaan: {kep}. "
        f"{ringkasan}", src, r['provinsi'])


def chunks_of(text, size=170, overlap=40):
    w = text.split()
    if len(w) <= size + 30:
        return [text]
    return [' '.join(w[i:i + size]) for i in range(0, len(w) - overlap, size - overlap)]


CHUNKS = []
for d in KB:
    for j, part in enumerate(chunks_of(d['teks'])):
        CHUNKS.append({'id': f"{d['doc_id']}#{j}", 'doc': d['doc_id'], 'jenis': d['jenis'], 'judul': d['judul'],
                       'teks': part if j == 0 else f"{d['judul']}. {part}", 'provinsi': d.get('provinsi'),
                       'sumber': d['sumber'][:2]})
print(f'Knowledge base: {len(KB)} dokumen, {len(CHUNKS)} chunk')


# 6. Ekspor
def dump(path, obj, indent=None):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=indent, separators=None if indent else (',', ':')), encoding='utf-8')


def clean(v):
    if isinstance(v, float) and math.isnan(v):
        return None
    if isinstance(v, (np.floating,)):
        return None if math.isnan(float(v)) else float(v)
    if isinstance(v, (np.integer,)):
        return int(v)
    return v


ringkasan_old = {d['doc_id']: '' for d in docs_old}
web_items = []
for _, r in item.iterrows():
    t = old_text.get(r['id'], '')
    m = re.search(r'(terbuka untuk direkomendasikan|sebelum dipromosikan sebagai objek wisata)\. (.*)$', t)
    web_items.append({k: clean(v) for k, v in {
        'id': r['id'], 'nama': r['nama'], 'provinsi': r['provinsi'], 'domain': r['domain'] if isinstance(r['domain'], str) else None,
        'tahun': int(r['tahun']), 'reg': r['no_registrasi'], 'artikel': r['judul_artikel'] if isinstance(r['judul_artikel'], str) else None,
        'en': r['judul_en'] if isinstance(r['judul_en'], str) else None, 'pv': int(r['pageviews_12b']),
        'V': round(float(r['V']), 4), 'IKD': None if pd.isna(r['IKD']) else round(float(r['IKD']), 4),
        'rank': None if pd.isna(r['peringkat_ikd']) else int(r['peringkat_ikd']),
        'kepekaan': r['kepekaan'], 'alasan': r['alasan_kepekaan'] or None,
        'vc': [round(float(r[c]), 3) for c in V_COMP], 'ringkasan': (m.group(2)[:600] if m else None)}.items()})
dump(DATA / 'warisan.json', web_items)
dump(PUB / 'data/warisan.json', [{k: w[k] for k in ['id', 'nama', 'provinsi', 'domain', 'tahun', 'artikel', 'en', 'pv', 'V', 'IKD',
                                                    'rank', 'kepekaan']} for w in web_items])

prov_rows = []
for _, r in reg.iterrows():
    prov_rows.append({k: clean(v) for k, v in {
        'provinsi': r['provinsi'], 'n': int(r['n_wbtbi']), 'K': round(r['K'], 4), 'V': round(r['V'], 4), 'A': round(r['A'], 4),
        'IKD': round(r['IKD'], 4), 'rank': int(r['peringkat_ikd']), 'tipologi': r['tipologi'],
        'tanpaArtikel': None if pd.isna(r['pct_tanpa_artikel']) else round(r['pct_tanpa_artikel'], 4),
        'museum': int(r['n_museum']), 'situs': int(r['n_situs']), 'wisnus': int(r['arus_wisata']),
        'entropi': round(r['entropi_domain'], 4), 'lat': cent[r['provinsi']][0], 'lon': cent[r['provinsi']][1]}.items()})
dump(DATA / 'provinsi.json', prov_rows)
dump(PUB / 'data/provinsi.json', prov_rows)

gj = json.load(open(SRC / '08_data_web/provinsi.geojson'))
pr = {r['provinsi']: r for r in prov_rows}
feats = []
for f in gj['features']:
    p = f['properties']['provinsi']
    if p in pr:
        feats.append({'type': 'Feature', 'properties': {'provinsi': p, 'IKD': pr[p]['IKD'], 'K': pr[p]['K'], 'V': pr[p]['V'],
                                                        'A': pr[p]['A'], 'perkiraan': False}, 'geometry': f['geometry']})
if 'DKI Jakarta' not in {f['properties']['provinsi'] for f in feats}:
    x0, y0, x1, y1 = JAKARTA_BOX
    p = pr['DKI Jakarta']
    feats.append({'type': 'Feature', 'properties': {'provinsi': 'DKI Jakarta', 'IKD': p['IKD'], 'K': p['K'], 'V': p['V'], 'A': p['A'],
                                                    'perkiraan': True},
                  'geometry': {'type': 'Polygon', 'coordinates': [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]}})
dump(PUB / 'data/provinsi.geojson', {'type': 'FeatureCollection', 'features': feats})

pt = pts.dropna(subset=['lat', 'lon'])
dump(PUB / 'data/titik.geojson', {'type': 'FeatureCollection', 'features': [
    {'type': 'Feature', 'properties': {'j': 'm' if r['jenis'] == 'museum' else 's', 'n': r['nama'] if isinstance(r['nama'], str) else None},
     'geometry': {'type': 'Point', 'coordinates': [round(r['lon'], 4), round(r['lat'], 4)]}} for _, r in pt.iterrows()]})

dump(PUB / 'data/jalur.json', {
    'provinsi': prov_list, 'jarak': np.round(DIST).astype(int).tolist(),
    'kandidat': [{'id': r['id'], 'p': int(pidx[r['provinsi']]), 'h': round(float(h), 4)} for (_, r), h in zip(cand.iterrows(), ikd_n)],
    'minat': [{**m, 'sim': s.tolist()} for m, s in zip(interests, sims)],
    'konfigurasi': {'lambda': best['lambda'], 'penalti': PEN, 'pool': POOL, 'topK': TOPK, 'skalaJarakKm': SCALE},
    'evaluasi': {'dasar': base_eval, 'terpilih': best, 'kurva': grid}})

robust_tbl = pd.read_csv(SRC / '03_analisis/robust_spearman_provinsi.csv', index_col=0)
dump(DATA / 'ringkasan.json', {
    'dkiPerkiraan': any(f['properties']['provinsi'] == 'DKI Jakarta' and f['properties']['perkiraan'] for f in feats),
    'n': len(item), 'nResmi': 2727, 'tanpaArtikel': float(1 - item['ada_artikel_id'].mean()),
    'tanpaEn': float(1 - item['ada_artikel_en'].mean()), 'gini': T_old['gini_pageviews'], 'top10': T_old['share_top10pct'],
    'medianPv': T_old['median_pv'], 'perluPersetujuan': float((item['kepekaan'] == 'perlu_persetujuan').mean()),
    'nMuseum': int((pts['jenis'] == 'museum').sum()), 'nSitus': int((pts['jenis'] == 'situs_warisan').sum()),
    'top5': top5, 'kayaTersembunyi': kt, 'baliRank': bali_rank, 'insights': INSIGHTS, 'robust': ROBUST,
    'cv': cvm, 'rag': ragc['evaluasi'], 'rekomendasi': {'dasar': base_eval, 'terpilih': best},
    'sumberA': A_SOURCE, 'pvWindow': '12 bulan penuh terakhir saat notebook dijalankan',
    'domain': {c: {'n': int((item['domain'] == c).sum()), 'tanpa': float(1 - item.loc[item['domain'] == c, 'ada_artikel_id'].mean())}
               for c in DOMAIN_LABEL},
})
dump(DATA / 'kb.json', CHUNKS)
shutil.copy(SRC / '07_rag/intents.json', DATA / 'intents.json')
labels = json.load(open(SRC / '05_model_cv/labels.json'))
dump(PUB / 'models/labels.json', labels, indent=1)
shutil.copy(SRC / '05_model_cv/rumah_adat.onnx', PUB / 'models/rumah_adat.onnx')
for f in ['fig04_lorenz_pageviews', 'fig06_kuadran_k_vs_v', 'fig08_uji_ketahanan', 'fig10_tradeoff_relevansi_pemerataan',
          'fig13_cv_matriks_kebingungan', 'fig15_kalibrasi_rag', 'fig02_tanpa_artikel_per_domain']:
    shutil.copy(SRC / f'04_visualisasi/{f}.png', PUB / f'figures/{f}.png')
manifest = pd.read_csv(SRC / '09_manifest/data_manifest.csv')
manifest.loc[len(manifest)] = {'dataset': 'Arus wisata (perjalanan wisatawan nusantara 2025)', 'url': A_SOURCE.split(' ')[-1],
                               'lisensi': 'Data resmi BPS', 'catatan': 'provinsi pemekaran digabung ke induk', 'jumlah_baris': 34,
                               'tanggal_ambil': '2026-11-20'}
dump(DATA / 'manifest.json', manifest.replace({np.nan: None}).to_dict('records'))
pd.DataFrame({'provinsi': list(WISNUS_2025), 'nilai': list(WISNUS_2025.values()), 'tahun': 2025,
              'satuan': 'perjalanan wisatawan nusantara', 'sumber': A_SOURCE}).to_csv(WEB / 'scripts/bps_arus_wisata.csv', index=False)
print('Selesai. Provinsi IKD tertinggi:', top5, '| Bali peringkat', bali_rank)
