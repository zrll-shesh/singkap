'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Meter from './Meter';
import Status from './Status';
import { useI18n } from './I18nProvider';
import { normText } from '@/lib/format';
import type { DomainCode, WarisanLite } from '@/lib/types';

const PAGE = 40;
type Sort = 'ikd' | 'nama' | 'tahun' | 'pv';
type Artikel = 'semua' | 'tanpa' | 'tanpa_en' | 'ada';

export default function JelajahApp({ provinsi, initialProv }: { provinsi: string[]; initialProv?: string }) {
  const { t, f } = useI18n();
  const J = t.jelajah;
  const [all, setAll] = useState<WarisanLite[] | null>(null);
  const [q, setQ] = useState('');
  const [prov, setProv] = useState(initialProv ?? '');
  const [dom, setDom] = useState('');
  const [art, setArt] = useState<Artikel>('semua');
  const [kep, setKep] = useState('');
  const [sort, setSort] = useState<Sort>('ikd');
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    fetch('/data/warisan.json')
      .then((r) => r.json())
      .then(setAll)
      .catch(() => setAll([]));
  }, []);

  useEffect(() => setShown(PAGE), [q, prov, dom, art, kep, sort]);

  const list = useMemo(() => {
    if (!all) return [];
    const nq = normText(q);
    const out = all.filter(
      (w) =>
        (!nq || normText(`${w.nama} ${w.provinsi}`).includes(nq)) &&
        (!prov || w.provinsi === prov) &&
        (!dom || w.domain === dom) &&
        (!kep || w.kepekaan === kep) &&
        (art === 'semua' || (art === 'tanpa' && !w.artikel) || (art === 'tanpa_en' && !w.en) || (art === 'ada' && w.artikel)),
    );
    const cmp: Record<Sort, (a: WarisanLite, b: WarisanLite) => number> = {
      ikd: (a, b) => (b.IKD ?? -1) - (a.IKD ?? -1),
      nama: (a, b) => a.nama.localeCompare(b.nama, 'id'),
      tahun: (a, b) => b.tahun - a.tahun,
      pv: (a, b) => b.pv - a.pv,
    };
    return out.sort(cmp[sort]);
  }, [all, q, prov, dom, art, kep, sort]);

  return (
    <>
      <div className="panel" style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="label" htmlFor="cari">
            {J.search}
          </label>
          <input id="cari" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={J.placeholder} />
        </div>
        <div>
          <label className="label" htmlFor="f-prov">{J.prov}</label>
          <select id="f-prov" className="pilih" value={prov} onChange={(e) => setProv(e.target.value)}>
            <option value="">{J.all}</option>
            {provinsi.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-dom">{J.domain}</label>
          <select id="f-dom" className="pilih" value={dom} onChange={(e) => setDom(e.target.value)}>
            <option value="">{J.all}</option>
            {(Object.keys(t.domainShort) as DomainCode[]).map((d) => (
              <option key={d} value={d}>
                {t.domainShort[d]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-art">{J.article}</label>
          <select id="f-art" className="pilih" value={art} onChange={(e) => setArt(e.target.value as Artikel)}>
            <option value="semua">{J.all}</option>
            <option value="tanpa">{J.noArt}</option>
            <option value="tanpa_en">{J.noEn}</option>
            <option value="ada">{J.hasArt}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-kep">{J.consent}</label>
          <select id="f-kep" className="pilih" value={kep} onChange={(e) => setKep(e.target.value)}>
            <option value="">{J.all}</option>
            <option value="terbuka">{t.common.open}</option>
            <option value="perlu_persetujuan">{t.common.needsConsent}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-sort">{J.sort}</label>
          <select id="f-sort" className="pilih" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="ikd">{J.sortIkd}</option>
            <option value="pv">{J.sortPv}</option>
            <option value="tahun">{J.sortYear}</option>
            <option value="nama">{J.sortName}</option>
          </select>
        </div>
      </div>

      {!all ? (
        <p className="kosong">{t.common.loading}</p>
      ) : (
        <>
          <p className="redup" aria-live="polite">
            {J.found(f.num(list.length))}
          </p>
          {list.length === 0 ? (
            <p className="kosong">{J.empty}</p>
          ) : (
            <ul className="daftar">
              {list.slice(0, shown).map((w) => (
                <li key={w.id}>
                  <Link className="baris" href={`/warisan/${w.id}`}>
                    <span>
                      <span className="baris-nama">{w.nama}</span>
                      <span className="baris-sub" style={{ display: 'block' }}>
                        {w.provinsi}, {w.tahun}
                        {w.domain ? `, ${t.domainShort[w.domain]}` : ''}
                        {w.artikel ? (w.en ? '' : J.rowNoEn) : J.rowNoArt}
                      </span>
                    </span>
                    <span style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {w.kepekaan === 'perlu_persetujuan' && <Status kepekaan={w.kepekaan} />}
                      <Meter value={w.IKD} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {shown < list.length && (
            <p style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="tombol tombol-gelap" onClick={() => setShown((s) => s + PAGE)}>
                {J.more(Math.min(PAGE, list.length - shown))}
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
