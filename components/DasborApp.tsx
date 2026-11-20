'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Meter from './Meter';
import { useI18n } from './I18nProvider';
import type { Dict } from '@/lib/i18n';
import type { Provinsi, WarisanLite } from '@/lib/types';

function toCsv(rows: WarisanLite[], t: Dict): string {
  const head = ['id', 'nama', 'provinsi', 'domain', 'tahun', 'artikel_id', 'artikel_en', 'kunjungan_12_bulan', 'V', 'IKD', 'peringkat', 'kepekaan'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    head.join(','),
    ...rows.map((w) =>
      [w.id, w.nama, w.provinsi, w.domain ? t.domainShort[w.domain] : '', w.tahun, w.artikel ?? '', w.en ?? '', w.pv, w.V, w.IKD ?? '', w.rank ?? '', w.kepekaan]
        .map(esc)
        .join(','),
    ),
  ].join('\n');
}

function Tabel({ rows, kolomArtikel = true }: { rows: WarisanLite[]; kolomArtikel?: boolean }) {
  const { t } = useI18n();
  const D = t.dasbor;
  if (!rows.length) return <p className="kosong">{D.empty}</p>;
  return (
    <div className="tabel-wadah">
      <table>
        <thead>
          <tr>
            <th>{D.cols[0]}</th>
            <th>{D.cols[1]}</th>
            <th className="angka">{D.cols[2]}</th>
            {kolomArtikel && <th>{D.cols[3]}</th>}
            <th className="angka">{D.cols[4]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((w) => (
            <tr key={w.id}>
              <td>
                <Link href={`/warisan/${w.id}`}>{w.nama}</Link>
              </td>
              <td>{w.domain ? t.domainShort[w.domain] : D.unclassified}</td>
              <td className="angka">{w.tahun}</td>
              {kolomArtikel && <td>{w.artikel ? (w.en ? D.artBoth : D.artId) : t.common.none}</td>}
              <td className="angka">
                <Meter value={w.IKD} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DasborApp({ provinsi, initial }: { provinsi: Provinsi[]; initial?: string }) {
  const { t, f } = useI18n();
  const D = t.dasbor;
  const sorted = useMemo(() => [...provinsi].sort((a, b) => a.provinsi.localeCompare(b.provinsi)), [provinsi]);
  const [sel, setSel] = useState(initial ?? sorted[0].provinsi);
  const [all, setAll] = useState<WarisanLite[] | null>(null);

  useEffect(() => {
    fetch('/data/warisan.json')
      .then((r) => r.json())
      .then(setAll)
      .catch(() => setAll([]));
  }, []);

  const p = provinsi.find((x) => x.provinsi === sel)!;
  const items = useMemo(() => (all ?? []).filter((w) => w.provinsi === sel), [all, sel]);
  const byRank = (a: WarisanLite, b: WarisanLite) => (a.rank ?? 1e9) - (b.rank ?? 1e9);
  const promosi = items.filter((w) => w.kepekaan === 'terbuka').sort(byRank).slice(0, 12);
  const dokumentasi = items.filter((w) => w.kepekaan === 'terbuka' && !w.artikel).sort(byRank);
  const terjemah = items.filter((w) => w.kepekaan === 'terbuka' && w.artikel && !w.en).sort(byRank).slice(0, 12);
  const konfirmasi = items.filter((w) => w.kepekaan === 'perlu_persetujuan').sort(byRank);
  const noEn = items.length ? items.filter((w) => !w.en).length / items.length : 0;

  function unduh() {
    const blob = new Blob([`\ufeff${toCsv([...items].sort(byRank), t)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `singkap_prioritas_${sel.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="panel" style={{ display: 'flex', gap: 16, alignItems: 'end', flexWrap: 'wrap', marginBottom: 28 }}>
        <div style={{ flex: '1 1 260px' }}>
          <label className="label" htmlFor="dasbor-prov">
            {D.prov}
          </label>
          <select id="dasbor-prov" className="pilih" value={sel} onChange={(e) => setSel(e.target.value)}>
            {sorted.map((x) => (
              <option key={x.provinsi}>{x.provinsi}</option>
            ))}
          </select>
        </div>
        <button className="tombol tombol-gelap" onClick={unduh} disabled={!items.length}>
          {D.download}
        </button>
      </div>

      <h2>{sel}</h2>
      <p className="redup">
        {D.sub(t.tipologi(p.tipologi), p.rank)}
      </p>
      <div className="angka-grid" style={{ margin: '20px 0 40px' }}>
        <div>
          <b>{f.dec(p.IKD, 2)}</b>
          <span>{D.kpi[0]}</span>
        </div>
        <div>
          <b>{f.num(p.n)}</b>
          <span>{D.kpi[1]}</span>
        </div>
        <div>
          <b>{p.tanpaArtikel !== null ? f.pct(p.tanpaArtikel, 0) : '-'}</b>
          <span>{D.kpi[2]}</span>
        </div>
        <div>
          <b>{f.pct(noEn, 0)}</b>
          <span>{D.kpi[3]}</span>
        </div>
        <div>
          <b>{f.compact(p.wisnus)}</b>
          <span>{D.kpi[4]}</span>
        </div>
        <div>
          <b>{f.num(p.museum + p.situs)}</b>
          <span>{D.kpi[5]}</span>
        </div>
      </div>

      {!all ? (
        <p className="kosong">{t.common.loading}</p>
      ) : (
        <>
          <section style={{ marginBottom: 44 }}>
            <h3 style={{ fontSize: 'var(--step-2)' }}>{D.promo}</h3>
            <p className="redup sempit">{D.promoBody}</p>
            <Tabel rows={promosi} />
          </section>
          <section style={{ marginBottom: 44 }}>
            <h3 style={{ fontSize: 'var(--step-2)' }}>{D.doc(f.num(dokumentasi.length))}</h3>
            <p className="redup sempit">{D.docBody}</p>
            <Tabel rows={dokumentasi.slice(0, 15)} kolomArtikel={false} />
          </section>
          <section style={{ marginBottom: 44 }}>
            <h3 style={{ fontSize: 'var(--step-2)' }}>{D.trans}</h3>
            <p className="redup sempit">{D.transBody}</p>
            <Tabel rows={terjemah} />
          </section>
          <section>
            <h3 style={{ fontSize: 'var(--step-2)' }}>{D.consent(f.num(konfirmasi.length))}</h3>
            <p className="redup sempit">{D.consentBody}</p>
            <Tabel rows={konfirmasi.slice(0, 15)} />
          </section>
        </>
      )}
    </>
  );
}
