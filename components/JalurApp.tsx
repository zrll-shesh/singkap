'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Meter from './Meter';
import { useI18n } from './I18nProvider';
import { RUTE } from '@/lib/perjalanan';
import type { WarisanLite } from '@/lib/types';

interface JalurData {
  provinsi: string[];
  jarak: number[][];
  kandidat: { id: string; p: number; h: number }[];
  minat: { label: string; label_en: string; n_prototipe: number; sim: number[] }[];
  konfigurasi: { lambda: number; penalti: number; pool: number; topK: number; skalaJarakKm: number };
}

interface Result {
  idx: number;
  rel: number;
  sim: number;
  interest: number;
}

function rank(d: JalurData, interests: number[], dest: number | null, lambda: number, penalty: number): Result[] {
  const n = d.kandidat.length;
  const scored = new Array(n);
  for (let i = 0; i < n; i++) {
    let sim = 0;
    let best = interests[0];
    for (const q of interests) {
      const v = d.minat[q].sim[i] / 255;
      if (v > sim) {
        sim = v;
        best = q;
      }
    }
    const prox = dest === null ? 1 : 0.5 + 0.5 * Math.exp(-d.jarak[dest][d.kandidat[i].p] / d.konfigurasi.skalaJarakKm);
    const rel = sim * prox;
    scored[i] = { idx: i, rel, sim, interest: best, score: lambda * rel + (1 - lambda) * d.kandidat[i].h };
  }
  const pool = scored.sort((a, b) => b.score - a.score).slice(0, d.konfigurasi.pool);
  const counts = new Map<number, number>();
  const out: Result[] = [];
  const used = new Set<number>();
  for (let k = 0; k < d.konfigurasi.topK; k++) {
    let bestJ = -1;
    let bestS = -Infinity;
    pool.forEach((c, j) => {
      if (used.has(j)) return;
      const s = c.score - penalty * (counts.get(d.kandidat[c.idx].p) ?? 0);
      if (s > bestS) {
        bestS = s;
        bestJ = j;
      }
    });
    if (bestJ < 0) break;
    used.add(bestJ);
    const c = pool[bestJ];
    counts.set(d.kandidat[c.idx].p, (counts.get(d.kandidat[c.idx].p) ?? 0) + 1);
    out.push(c);
  }
  return out;
}

export default function JalurApp({ initialTujuan, ramai }: { initialTujuan?: string; ramai: string[] }) {
  const { t, f, lang } = useI18n();
  const J = t.jalur;
  const [data, setData] = useState<JalurData | null>(null);
  const [items, setItems] = useState<Map<string, WarisanLite>>(new Map());
  const [interests, setInterests] = useState<number[]>([0]);
  const [dest, setDest] = useState<number | null>(null);
  const [level, setLevel] = useState(0.3);
  const [compare, setCompare] = useState(false);
  const [allInterests, setAllInterests] = useState(false);
  const [traveller, setTraveller] = useState<'foreign' | 'domestic'>(lang === 'en' ? 'foreign' : 'domestic');
  const [guideProv, setGuideProv] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/data/jalur.json').then((r) => r.json()), fetch('/data/warisan.json').then((r) => r.json())])
      .then(([j, w]: [JalurData, WarisanLite[]]) => {
        setData(j);
        setItems(new Map(w.map((x) => [x.id, x])));
        setLevel(Math.min(1, Math.max(0, (1 - j.konfigurasi.lambda) / 0.5)));
        if (initialTujuan) {
          const i = j.provinsi.indexOf(initialTujuan);
          if (i >= 0) setDest(i);
        }
      })
      .catch(() => setError(true));
  }, [initialTujuan]);

  const lambda = 1 - 0.5 * level;
  const results = useMemo(
    () => (data && interests.length ? rank(data, interests, dest, lambda, data.konfigurasi.penalti) : []),
    [data, interests, dest, lambda],
  );
  const baseline = useMemo(
    () => (data && interests.length ? rank(data, interests, dest, 1, 0) : []),
    [data, interests, dest],
  );

  if (error) return <p className="kosong">{J.loadFail}</p>;
  if (!data) return <p className="kosong">{J.loading}</p>;
  const label = (i: number) => (lang === 'en' ? data.minat[i].label_en : data.minat[i].label);

  const recLevel = (1 - data.konfigurasi.lambda) / 0.5;
  const destName = dest !== null ? data.provinsi[dest] : null;
  const summary = (list: Result[]) => {
    const iks = list.map((r) => items.get(data.kandidat[r.idx].id)?.IKD ?? 0);
    return {
      ikd: iks.reduce((a, b) => a + b, 0) / Math.max(1, iks.length),
      prov: new Set(list.map((r) => data.kandidat[r.idx].p)).size,
    };
  };
  const sNow = summary(results);
  const sBase = summary(baseline);
  const spread = new Map<number, number>();
  results.forEach((r) => spread.set(data.kandidat[r.idx].p, (spread.get(data.kandidat[r.idx].p) ?? 0) + 1));

  function toggleInterest(i: number) {
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : cur.length >= 3 ? [...cur.slice(1), i] : [...cur, i]));
  }

  function renderList(list: Result[], showWhy: boolean) {
    return (
      <ol className="daftar" style={{ listStyle: 'none' }}>
        {list.map((r, k) => {
          const cand = data!.kandidat[r.idx];
          const w = items.get(cand.id);
          if (!w) return null;
          const km = dest !== null ? data!.jarak[dest][cand.p] : null;
          return (
            <li key={cand.id} className="hasil-kartu">
              <span className="hasil-no" aria-hidden="true">
                {k + 1}
              </span>
              <div>
                <h3>
                  <Link href={`/warisan/${w.id}`}>{w.nama}</Link>
                </h3>
                <span className="baris-sub">
                  {w.provinsi}
                  {w.domain ? `, ${t.domainShort[w.domain]}` : ''}
                </span>
                {showWhy && (
                  <p className="mengapa">
                    {J.why(label(r.interest), f.pct(r.sim, 0))}
                    {km !== null ? (km < 30 ? J.inDest : J.km(f.num(km))) : ''}
                    {w.artikel ? '' : J.noArticle}
                    {!w.artikel || w.en ? '' : J.noEn}.
                  </p>
                )}
                {showWhy && (
                  <button
                    type="button"
                    className="tautan-tombol"
                    style={{ marginTop: 4 }}
                    onClick={() => {
                      setGuideProv(w.provinsi);
                      document.getElementById('panduan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    {J.planThis}
                  </button>
                )}
              </div>
              <Meter value={w.IKD} />
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <>
    <section className="cara-pakai" aria-labelledby="judul-cara">
      <h2 id="judul-cara">{J.howTitle}</h2>
      <ol>
        {J.howSteps.map((t, i) => (
          <li key={i}>
            <span className="langkah-no" aria-hidden="true">
              {i + 1}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </section>
    <div className="dua-kolom">
      <aside className="panel lekat" aria-label="Pengaturan rekomendasi">
        <div className="kelompok">
          <span className="label" id="label-minat">
            {J.interests}
          </span>
          <div className="keping-grup" role="group" aria-labelledby="label-minat">
            {data.minat
              .map((m, i) => ({ m, i }))
              .filter(({ i }) => allInterests || i < 10 || interests.includes(i))
              .map(({ m, i }) => (
                <button key={m.label} className="keping" aria-pressed={interests.includes(i)} onClick={() => toggleInterest(i)}>
                  {lang === 'en' ? m.label_en : m.label}
                </button>
              ))}
          </div>
          <button
            type="button"
            className="tautan-tombol"
            aria-expanded={allInterests}
            onClick={() => setAllInterests((v) => !v)}
          >
            {allInterests ? J.lessInterests : J.moreInterests(data.minat.length)}
          </button>
        </div>
        <div className="kelompok">
          <label className="label" htmlFor="tujuan">
            {J.destination}
          </label>
          <select id="tujuan" className="pilih" value={dest ?? ''} onChange={(e) => setDest(e.target.value === '' ? null : Number(e.target.value))}>
            <option value="">{J.anywhere}</option>
            {data.provinsi
              .map((p, i) => ({ p, i }))
              .sort((a, b) => a.p.localeCompare(b.p))
              .map(({ p, i }) => (
                <option key={p} value={i}>
                  {p}
                </option>
              ))}
          </select>
        </div>
        <div className="kelompok">
          <label className="label" htmlFor="pemerataan">
            {J.fairness(f.pct(level, 0))}
          </label>
          <input
            id="pemerataan"
            className="slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            aria-describedby="pemerataan-info"
          />
          <div className="skala">
            <span>{J.mostRelevant}</span>
            <span>{J.mostRevealing}</span>
          </div>
          <p id="pemerataan-info" className="catatan" style={{ marginTop: 10 }}>
            {J.teamNote(f.pct(recLevel, 0))}{' '}
            <button className="keping" style={{ padding: '2px 10px' }} onClick={() => setLevel(recLevel)}>
              {J.useTeam}
            </button>
          </p>
        </div>
        <label className="sakelar" style={{ color: 'var(--tinta)' }}>
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
          {J.compare}
        </label>
      </aside>

      <section aria-live="polite">
        {destName && ramai.includes(destName) && (
          <div className="peringatan-peka" style={{ borderLeftColor: 'var(--kunyit)', background: '#fbf1dc' }}>
            <strong style={{ color: 'var(--kunyit-gelap)' }}>{J.crowded(destName)}</strong> {J.crowdedBody}
          </div>
        )}
        {!interests.length ? (
          <p className="kosong">{J.pickOne}</p>
        ) : (
          <>
            <div className="angka-grid" style={{ marginBottom: 24 }}>
              <div>
                <b>{f.dec(sNow.ikd)}</b>
                <span>{J.avgIkd}</span>
              </div>
              <div>
                <b>{sNow.prov}</b>
                <span>{J.provCount}</span>
              </div>
              <div>
                <b>{f.pct(level, 0)}</b>
                <span>{J.lambda}</span>
              </div>
            </div>
            <h2 style={{ fontSize: 'var(--step-2)' }}>
              {destName ? J.headingDest(destName) : J.heading}
            </h2>
            {renderList(results, true)}
            <p className="label" style={{ marginTop: 18 }}>
              {J.spread}
            </p>
            <div className="sebaran" aria-hidden="true">
              {data.provinsi.map((p, i) => (
                <span key={p} className={spread.has(i) ? 'aktif' : ''} style={{ height: `${((spread.get(i) ?? 0) / 4) * 100}%` }} title={p} />
              ))}
            </div>
            {(() => {
              const provs = [...new Set(results.map((r) => data.provinsi[data.kandidat[r.idx].p]))];
              if (!provs.length) return null;
              const gp = guideProv && provs.includes(guideProv) ? guideProv : destName && provs.includes(destName) ? destName : provs[0];
              const rute = RUTE[gp];
              const namaBandara = rute ? (lang === 'en' ? `${rute.bandara.replace(/^Bandara (Internasional )?/, '')} Airport` : rute.bandara) : '';
              const extra = rute?.catatan ? rute.catatan[lang] : '';
              let steps: string[][] = rute
                ? traveller === 'foreign'
                  ? J.stepsForeign(gp, namaBandara, rute.kode, rute.kota, extra)
                  : J.stepsDomestic(gp, namaBandara, rute.kode, rute.kota, extra)
                : [];
              if (rute && traveller === 'foreign' && (rute.kode === 'CGK' || rute.kode === 'DPS')) {
                steps = [steps[0], J.directArrive(namaBandara, rute.kode, rute.kota), ...steps.slice(3)];
              }
              const itemsHere = results
                .map((r) => items.get(data.kandidat[r.idx].id))
                .filter((w): w is WarisanLite => Boolean(w && w.provinsi === gp));
              return (
                <section id="panduan" className="panduan" aria-labelledby="judul-panduan">
                  <h2 id="judul-panduan" style={{ fontSize: 'var(--step-2)', marginBottom: 4 }}>
                    {J.guideTitle}
                  </h2>
                  <p className="redup" style={{ marginBottom: 14 }}>
                    {J.guideLead}
                  </p>
                  <div className="panduan-pilihan">
                    <div>
                      <span className="label">{J.travellerLabel}</span>
                      <div className="keping-grup" role="group" aria-label={J.travellerLabel}>
                        <button type="button" className="keping" aria-pressed={traveller === 'domestic'} onClick={() => setTraveller('domestic')}>
                          {J.domestic}
                        </button>
                        <button type="button" className="keping" aria-pressed={traveller === 'foreign'} onClick={() => setTraveller('foreign')}>
                          {J.foreign}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="label">{J.guidePick}</span>
                      <div className="keping-grup" role="group" aria-label={J.guidePick}>
                        {provs.map((p) => (
                          <button key={p} type="button" className="keping" aria-pressed={p === gp} onClick={() => setGuideProv(p)}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="label" style={{ marginTop: 18 }}>
                    {J.guideItems(gp)}
                  </p>
                  <p style={{ marginTop: 0 }}>
                    {itemsHere.map((w, i) => (
                      <span key={w.id}>
                        {i > 0 && ', '}
                        <Link href={`/warisan/${w.id}`}>{w.nama}</Link>
                      </span>
                    ))}
                  </p>
                  <ol className="langkah-perjalanan">
                    {steps.map(([judul, isi], i) => (
                      <li key={i}>
                        <span className="langkah-no" aria-hidden="true">
                          {i + 1}
                        </span>
                        <div>
                          <strong>{judul}</strong>
                          <p>{isi}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="catatan">{J.guideNote}</p>
                </section>
              );
            })()}
            {compare && (
              <div style={{ marginTop: 36 }}>
                <h2 style={{ fontSize: 'var(--step-2)' }}>{J.baseline}</h2>
                <p className="catatan">{J.baselineNote(f.dec(sBase.ikd), sBase.prov, f.dec(sNow.ikd), sNow.prov)}</p>
                {renderList(baseline, false)}
              </div>
            )}
            <p className="catatan" style={{ marginTop: 24 }}>
              {J.footnote}
            </p>
          </>
        )}
      </section>
    </div>
    </>
  );
}
