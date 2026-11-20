'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from './I18nProvider';

function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

function Figure({ children, caption, title, kecil }: { children: ReactNode; caption?: string; title: string; kecil?: boolean }) {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <figure ref={ref} className={`grafik${kecil ? ' grafik-kecil' : ''}`} data-tampil={seen}>
      <figcaption className="grafik-judul">{title}</figcaption>
      {children}
      {caption && <p className="grafik-catatan">{caption}</p>}
    </figure>
  );
}

/* Batang horizontal beranimasi */
export interface BarDatum {
  label: string;
  value: number;
  display: string;
  tone?: 'kunyit' | 'mengkudu' | 'tarum';
}

export function AnimatedBars({ data, max = 1 }: { data: BarDatum[]; max?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} role="list" className="batang-grup" data-tampil={seen}>
      {data.map((d, i) => (
        <div className="batang" role="listitem" key={d.label}>
          <span>{d.label}</span>
          <span className="batang-jalur" aria-hidden="true">
            <span
              className={`batang-isi ${d.tone === 'tarum' ? '' : d.tone ?? 'kunyit'}`}
              style={{ width: `${Math.max(1.5, (d.value / max) * 100)}%`, transitionDelay: `${i * 90}ms` }}
            />
          </span>
          <span className="batang-angka">{d.display}</span>
        </div>
      ))}
    </div>
  );
}

/* Kurva Lorenz perhatian digital */
export function LorenzChart({ points, top10, gini, title, caption }: { points: number[]; top10: number; gini: number; title: string; caption: string }) {
  const { f, lang } = useI18n();
  const P = 44;
  const S = 320;
  const xy = (x: number, y: number) => [P + x * S, P + S - y * S];
  const d = points.map((y, i) => xy(i / (points.length - 1), y)).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${P + S},${P + S} L${P},${P + S} Z`;
  const [mx, my] = xy(0.9, 1 - top10);
  return (
    <Figure title={title} caption={caption} kecil>
      <svg viewBox="0 0 400 400" role="img" aria-label={title}>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={P} x2={P + S} y1={xy(0, v)[1]} y2={xy(0, v)[1]} className="g-kisi" />
            <text x={P - 8} y={xy(0, v)[1] + 4} className="g-sumbu" textAnchor="end">
              {Math.round(v * 100)}%
            </text>
            <text x={xy(v, 0)[0]} y={P + S + 18} className="g-sumbu" textAnchor="middle">
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}
        <line x1={P} y1={P + S} x2={P + S} y2={P} className="g-setara" />
        <path d={area} className="g-area anim-pudar" />
        <path d={d} pathLength={1} className="g-garis g-garis-kunyit anim-garis" />
        <g className="anim-pudar" style={{ transitionDelay: '1.4s' }}>
          <line x1={mx} y1={my} x2={P + S} y2={my} className="g-penunjuk" />
          <circle cx={mx} cy={my} r={5} className="g-titik-kunyit" />
          <text x={mx - 8} y={my - 12} className="g-anotasi" textAnchor="end">
            {lang === 'en' ? `Bottom 90% of articles: ${f.pct(1 - top10, 0)} of views` : `90% artikel terbawah: ${f.pct(1 - top10, 0)} kunjungan`}
          </text>
        </g>
        <text x={P + S - 6} y={P + 16} className="g-label-setara" textAnchor="end">
          {lang === 'en' ? 'Perfect equality' : 'Pemerataan sempurna'}
        </text>
        <text x={P + 8} y={P + 18} className="g-anotasi-besar">
          Gini {f.dec(gini)}
        </text>
      </svg>
    </Figure>
  );
}

/* Penetapan per tahun dan porsi tanpa artikel */
export function YearChart({ rows, title, caption }: { rows: { tahun: number; n: number; tanpa: number }[]; title: string; caption: string }) {
  const { f, lang } = useI18n();
  const W = 640;
  const H = 300;
  const P = { l: 36, r: 12, t: 34, b: 34 };
  const max = Math.max(...rows.map((r) => r.n));
  const bw = (W - P.l - P.r) / rows.length;
  const y = (v: number) => P.t + (H - P.t - P.b) * (1 - v / max);
  return (
    <Figure title={title} caption={caption}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {[0, 0.5, 1].map((v) => (
          <line key={v} x1={P.l} x2={W - P.r} y1={y(max * v)} y2={y(max * v)} className="g-kisi" />
        ))}
        {rows.map((r, i) => {
          const x = P.l + i * bw + bw * 0.16;
          const w = bw * 0.68;
          const share = r.n ? r.tanpa / r.n : 0;
          return (
            <g key={r.tahun} className="anim-tumbuh" style={{ transitionDelay: `${i * 70}ms`, transformOrigin: `0 ${H - P.b}px` }}>
              <rect x={x} y={y(r.n)} width={w} height={H - P.b - y(r.n)} rx={3} className="g-isi-tarum" />
              <rect x={x} y={y(r.n)} width={w} height={H - P.b - y(r.tanpa)} rx={3} className="g-isi-kunyit" />
              <text x={x + w / 2} y={y(r.n) - 6} className="g-nilai" textAnchor="middle">
                {f.pct(share, 0)}
              </text>
              <text x={x + w / 2} y={H - 12} className="g-sumbu" textAnchor="middle">
                {String(r.tahun).slice(2)}
              </text>
            </g>
          );
        })}
        <g transform={`translate(${P.l},12)`} className="g-legenda">
          <rect width={10} height={10} rx={2} className="g-isi-kunyit" />
          <text x={16} y={9}>{lang === 'en' ? 'No Wikipedia article' : 'Tanpa artikel Wikipedia'}</text>
          <rect x={260} width={10} height={10} rx={2} className="g-isi-tarum" />
          <text x={276} y={9}>{lang === 'en' ? 'Has an article' : 'Sudah ada artikel'}</text>
        </g>
      </svg>
    </Figure>
  );
}

/* Kuadran provinsi: kekayaan budaya vs visibilitas digital */
export interface QuadProv {
  provinsi: string;
  K: number;
  V: number;
  IKD: number;
  n: number;
  rank: number;
}

const RAMP = ['#3b4c8c', '#6c6aa0', '#b77f43', '#e8a93a', '#f6cf7d'];
function rampColor(t: number) {
  const i = Math.min(RAMP.length - 1, Math.max(0, Math.round(t * (RAMP.length - 1))));
  return RAMP[i];
}

export function QuadrantChart({ data, title, caption }: { data: QuadProv[]; title: string; caption: string }) {
  const { f, lang } = useI18n();
  const [hover, setHover] = useState<QuadProv | null>(null);
  const W = 640;
  const H = 480;
  const P = { l: 52, r: 20, t: 44, b: 46 };
  const vs = data.map((d) => d.V);
  const ks = data.map((d) => d.K);
  const [v0, v1] = [Math.min(...vs) - 0.02, Math.max(...vs) + 0.02];
  const [k0, k1] = [Math.min(...ks) - 0.05, Math.max(...ks) + 0.05];
  const x = (v: number) => P.l + ((v - v0) / (v1 - v0)) * (W - P.l - P.r);
  const y = (k: number) => P.t + (1 - (k - k0) / (k1 - k0)) * (H - P.t - P.b);
  const med = (a: number[]) => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)];
  const mv = med(vs);
  const mk = med(ks);
  const maxIkd = Math.max(...data.map((d) => d.IKD));
  const maxN = Math.max(...data.map((d) => d.n));
  return (
    <Figure title={title} caption={caption}>
      <div className="grafik-relatif">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
          <rect x={P.l} y={P.t} width={x(mv) - P.l} height={y(mk) - P.t} className="g-zona" />
          <line x1={x(mv)} x2={x(mv)} y1={P.t} y2={H - P.b} className="g-median" />
          <line x1={P.l} x2={W - P.r} y1={y(mk)} y2={y(mk)} className="g-median" />
          <text x={P.l} y={P.t - 14} className="g-zona-label">
            {lang === 'en' ? 'Rich but hidden' : 'Kaya namun tersembunyi'}
          </text>
          <text x={W - P.r} y={P.t - 14} className="g-zona-label g-redup" textAnchor="end">
            {lang === 'en' ? 'Rich and visible' : 'Kaya dan terlihat'}
          </text>
          <text x={(P.l + W - P.r) / 2} y={H - 8} className="g-sumbu" textAnchor="middle">
            {lang === 'en' ? 'Digital visibility (V)' : 'Visibilitas digital (V)'}
          </text>
          <text transform={`translate(14 ${(P.t + H - P.b) / 2}) rotate(-90)`} className="g-sumbu" textAnchor="middle">
            {lang === 'en' ? 'Cultural richness (K)' : 'Kekayaan budaya (K)'}
          </text>
          {data.map((d, i) => (
            <g
              key={d.provinsi}
              className="anim-muncul"
              style={{ transitionDelay: `${300 + i * 35}ms`, transformOrigin: `${x(d.V)}px ${y(d.K)}px` }}
              onMouseEnter={() => setHover(d)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              role="img"
              aria-label={`${d.provinsi}: K ${f.dec(d.K)}, V ${f.dec(d.V)}, IKD ${f.dec(d.IKD)}`}
            >
              <circle cx={x(d.V)} cy={y(d.K)} r={5 + 11 * Math.sqrt(d.n / maxN)} fill={rampColor(d.IKD / maxIkd)} className="g-gelembung" />
              {d.rank <= 5 && (
                <text
                  x={x(d.V) + (d.rank % 2 ? 1 : -1) * (12 + 8 * Math.sqrt(d.n / maxN))}
                  y={y(d.K) + (d.rank % 2 ? -6 : 16)}
                  className="g-label-titik"
                  textAnchor={d.rank % 2 ? 'start' : 'end'}
                >
                  {d.provinsi}
                </text>
              )}
            </g>
          ))}
        </svg>
        {hover && (
          <div className="grafik-tooltip" style={{ left: `${(x(hover.V) / W) * 100}%`, top: `${(y(hover.K) / H) * 100}%` }}>
            <strong>{hover.provinsi}</strong>
            <span>
              {lang === 'en' ? 'Rank' : 'Peringkat'} {hover.rank}, IKD {f.dec(hover.IKD)}
            </span>
            <span>
              K {f.dec(hover.K)}, V {f.dec(hover.V)}, {f.num(hover.n)} {lang === 'en' ? 'items' : 'warisan'}
            </span>
          </div>
        )}
      </div>
    </Figure>
  );
}

/* Kurva kompromi rekomendasi */
export interface CurvePoint {
  lambda: number;
  ndcg10: number;
  gini: number;
  ikd_rata2: number;
  porsi_5_terlihat: number;
}

export function TradeoffChart({
  kurva,
  dasar,
  pilih,
  title,
  caption,
}: {
  kurva: CurvePoint[];
  dasar: CurvePoint;
  pilih: number;
  title: string;
  caption: string;
}) {
  const { f, lang } = useI18n();
  const W = 640;
  const H = 380;
  const P = { l: 56, r: 24, t: 24, b: 50 };
  const pts = kurva.filter((k) => k.lambda >= 0.4);
  const xs = [...pts.map((p) => p.ikd_rata2), dasar.ikd_rata2];
  const ys = [...pts.map((p) => p.ndcg10), dasar.ndcg10];
  const [x0, x1] = [Math.min(...xs) * 0.97, Math.max(...xs) * 1.02];
  const [y0, y1] = [Math.min(...ys, 0.85) - 0.02, 1.01];
  const x = (v: number) => P.l + ((v - x0) / (x1 - x0)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.ikd_rata2).toFixed(1)},${y(p.ndcg10).toFixed(1)}`).join(' ');
  const chosen = pts.find((p) => Math.abs(p.lambda - pilih) < 1e-6) ?? pts[0];
  return (
    <Figure title={title} caption={caption}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {[0.85, 0.9, 0.95, 1].filter((v) => v >= y0).map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className={v === 0.9 ? 'g-ambang' : 'g-kisi'} />
            <text x={P.l - 8} y={y(v) + 4} className="g-sumbu" textAnchor="end">
              {f.dec(v)}
            </text>
          </g>
        ))}
        <text x={W - P.r - 4} y={y(0.9) - 6} className="g-label-ambang" textAnchor="end">
          {lang === 'en' ? 'Minimum relevance 0.90' : 'Batas relevansi 0,90'}
        </text>
        <path d={d} pathLength={1} className="g-garis g-garis-tarum anim-garis" />
        {pts.map((p, i) => (
          <circle
            key={p.lambda}
            cx={x(p.ikd_rata2)}
            cy={y(p.ndcg10)}
            r={3.2}
            className="g-titik-tarum anim-muncul"
            style={{ transitionDelay: `${400 + i * 60}ms`, transformOrigin: `${x(p.ikd_rata2)}px ${y(p.ndcg10)}px` }}
          />
        ))}
        <g className="anim-pudar" style={{ transitionDelay: '0.2s' }}>
          <rect x={x(dasar.ikd_rata2) - 6} y={y(dasar.ndcg10) - 6} width={12} height={12} rx={2} className="g-dasar" />
          <text x={x(dasar.ikd_rata2) + 12} y={y(dasar.ndcg10) + 18} className="g-anotasi">
            {lang === 'en' ? 'Ordinary recommender' : 'Rekomendasi biasa'}
          </text>
        </g>
        <g className="anim-muncul" style={{ transitionDelay: '1.6s', transformOrigin: `${x(chosen.ikd_rata2)}px ${y(chosen.ndcg10)}px` }}>
          <circle cx={x(chosen.ikd_rata2)} cy={y(chosen.ndcg10)} r={11} className="g-pilih-cincin" />
          <circle cx={x(chosen.ikd_rata2)} cy={y(chosen.ndcg10)} r={6} className="g-titik-kunyit" />
          <text x={x(chosen.ikd_rata2) + 16} y={y(chosen.ndcg10) - 10} className="g-anotasi-besar">
            SINGKAP λ = {f.dec(chosen.lambda)}
          </text>
        </g>
        <text x={(P.l + W - P.r) / 2} y={H - 10} className="g-sumbu" textAnchor="middle">
          {lang === 'en' ? 'Average index of suggested items (more hidden →)' : 'Rata-rata IKD warisan yang disarankan (makin tersembunyi →)'}
        </text>
        <text transform={`translate(16 ${(P.t + H - P.b) / 2}) rotate(-90)`} className="g-sumbu" textAnchor="middle">
          {lang === 'en' ? 'Relevance (NDCG@10)' : 'Relevansi (NDCG@10)'}
        </text>
      </svg>
    </Figure>
  );
}

/* Uji ketahanan: matriks korelasi dan ablasi */
const KOMPONEN: Record<string, [string, string]> = {
  v_artikel_id: ['Artikel ID', 'ID article'],
  v_artikel_en: ['Artikel EN', 'EN article'],
  v_wikidata: ['Wikidata', 'Wikidata'],
  v_gambar: ['Gambar', 'Image'],
  v_pageviews: ['Kunjungan', 'Page views'],
  v_panjang: ['Panjang', 'Length'],
  '(bobot PCA)': ['Bobot PCA', 'PCA weights'],
};
const SKEMA: Record<string, string> = { Dasar: 'Base', 'Bobot PCA': 'PCA weights', Aditif: 'Additive' };

export function RobustChart({
  rho,
  ablasi,
  title,
  caption,
}: {
  rho: { label: string[]; nilai: number[][] };
  ablasi: { komponen: string; rho: number; irisan: number }[];
  title: string;
  caption: string;
}) {
  const { f, lang } = useI18n();
  const en = lang === 'en';
  const n = rho.label.length;
  const C = 74;
  return (
    <Figure title={title} caption={caption}>
      <div className="grafik-dua">
        <svg viewBox={`0 0 ${110 + n * C} ${40 + n * C}`} role="img" aria-label={en ? 'Rank correlation between schemes' : 'Korelasi peringkat antarskema'}>
          {rho.label.map((l, i) => (
            <g key={l}>
              <text x={100} y={30 + i * C + C / 2 + 4} className="g-sumbu" textAnchor="end">
                {en ? SKEMA[l] ?? l : l}
              </text>
              <text x={110 + i * C + C / 2} y={22} className="g-sumbu" textAnchor="middle">
                {en ? SKEMA[l] ?? l : l}
              </text>
            </g>
          ))}
          {rho.nilai.map((row, i) =>
            row.map((v, j) => (
              <g key={`${i}-${j}`} className="anim-pudar" style={{ transitionDelay: `${(i + j) * 120}ms` }}>
                <rect x={110 + j * C + 2} y={30 + i * C + 2} width={C - 4} height={C - 4} rx={8} fill={rampColor((v - 0.8) / 0.2)} />
                <text x={110 + j * C + C / 2} y={30 + i * C + C / 2 + 5} className="g-sel" textAnchor="middle">
                  {f.dec(v)}
                </text>
              </g>
            )),
          )}
        </svg>
        <AnimatedBars
          data={ablasi.map((a) => ({
            label: (KOMPONEN[a.komponen] ?? [a.komponen, a.komponen])[en ? 1 : 0],
            value: a.irisan,
            display: f.pct(a.irisan, 0),
            tone: 'kunyit',
          }))}
        />
      </div>
    </Figure>
  );
}

export function BarsFigure({ title, caption, data, max }: { title: string; caption: string; data: BarDatum[]; max?: number }) {
  return (
    <Figure title={title} caption={caption}>
      <AnimatedBars data={data} max={max} />
    </Figure>
  );
}
