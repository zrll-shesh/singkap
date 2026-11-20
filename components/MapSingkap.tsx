'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MLMap, MapLayerMouseEvent } from 'maplibre-gl';
import Meter from './Meter';
import Bars from './Bars';
import { useI18n } from './I18nProvider';
import type { DomainCode, Provinsi, WarisanLite } from '@/lib/types';

type Metric = 'IKD' | 'K' | 'V' | 'A';

const METRIC_KEYS: Metric[] = ['IKD', 'K', 'V', 'A'];
const RAMP = ['#2c3b77', '#4a5590', '#a8784a', '#e8a93a', '#f8d995'];
const HEIGHT = 380000;

export default function MapSingkap({
  provinsi,
  initial,
  dkiApprox,
}: {
  provinsi: Provinsi[];
  initial?: string;
  dkiApprox: boolean;
}) {
  const { t, f } = useI18n();
  const M = t.map;
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [metric, setMetric] = useState<Metric>('IKD');
  const [threeD, setThreeD] = useState(true);
  const [points, setPoints] = useState(false);
  const [selected, setSelected] = useState<string | null>(initial ?? null);
  const [hover, setHover] = useState<{ x: number; y: number; name: string } | null>(null);
  const [items, setItems] = useState<WarisanLite[]>([]);
  const [failed, setFailed] = useState(false);

  const max = useMemo(() => {
    const m: Record<Metric, number> = { IKD: 0, K: 0, V: 0, A: 0 };
    for (const p of provinsi) (Object.keys(m) as Metric[]).forEach((k) => (m[k] = Math.max(m[k], p[k])));
    return m;
  }, [provinsi]);
  const byName = useMemo(() => new Map(provinsi.map((p) => [p.provinsi, p])), [provinsi]);

  useEffect(() => {
    fetch('/data/warisan.json')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let map: MLMap | null = null;
    let cancelled = false;
    import('maplibre-gl')
      .then((maplibregl) => {
        if (cancelled || !boxRef.current) return;
        maplibregl.setWorkerUrl(new URL('/maplibre/maplibre-gl-worker.mjs', window.location.origin).href);
        map = new maplibregl.Map({
          container: boxRef.current,
          style: {
            version: 8,
            sources: {
              prov: { type: 'geojson', data: new URL('/data/provinsi.geojson', window.location.origin).href },
              titik: { type: 'geojson', data: new URL('/data/titik.geojson', window.location.origin).href },
            },
            layers: [{ id: 'latar', type: 'background', paint: { 'background-color': '#18224d' } }],
          },
          center: [118, -2.6],
          zoom: window.innerWidth < 760 ? 3.1 : 4.1,
          pitch: 52,
          bearing: -10,
          attributionControl: false,
          maxPitch: 70,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left');
        map.on('error', () => undefined);
        map.on('load', () => {
          if (!map) return;
          map.addLayer({
            id: 'prov-3d',
            type: 'fill-extrusion',
            source: 'prov',
            paint: {
              'fill-extrusion-color': '#2c3b77',
              'fill-extrusion-height': 0,
              'fill-extrusion-opacity': 0.95,
            },
          });
          map.addLayer({
            id: 'prov-garis',
            type: 'line',
            source: 'prov',
            paint: { 'line-color': 'rgba(214,222,255,0.35)', 'line-width': 0.6 },
          });
          map.addLayer({
            id: 'prov-sorot',
            type: 'line',
            source: 'prov',
            filter: ['==', ['get', 'provinsi'], ''],
            paint: { 'line-color': '#f6cf7d', 'line-width': 2.4 },
          });
          map.addLayer({
            id: 'titik',
            type: 'circle',
            source: 'titik',
            layout: { visibility: 'none' },
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 1.2, 8, 4],
              'circle-color': ['match', ['get', 'j'], 'm', '#f3efe6', '#9fb0ea'],
              'circle-opacity': 0.75,
            },
          });
          const narrow = window.innerWidth < 1100;
          const panelH = (document.querySelector('.peta-kendali') as HTMLElement | null)?.offsetHeight ?? 0;
          map.fitBounds(
            [
              [94.8, -11.2],
              [141.1, 6.2],
            ],
            {
              padding: narrow ? { top: panelH + 24, bottom: 40, left: 10, right: 10 } : { top: 60, bottom: 60, left: 380, right: 60 },
              pitch: narrow ? 40 : 52,
              bearing: -10,
              duration: 0,
            },
          );
          setReady(true);
        });
        map.on('mousemove', 'prov-3d', (e: MapLayerMouseEvent) => {
          const name = e.features?.[0]?.properties?.provinsi as string | undefined;
          if (!name) return;
          map!.getCanvas().style.cursor = 'pointer';
          setHover({ x: e.point.x, y: e.point.y, name });
        });
        map.on('mouseleave', 'prov-3d', () => {
          map!.getCanvas().style.cursor = '';
          setHover(null);
        });
        map.on('click', 'prov-3d', (e: MapLayerMouseEvent) => {
          const name = e.features?.[0]?.properties?.provinsi as string | undefined;
          if (name) setSelected(name);
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const value: unknown = ['/', ['coalesce', ['get', metric], 0], max[metric] || 1];
    map.setPaintProperty('prov-3d', 'fill-extrusion-color', [
      'interpolate',
      ['linear'],
      value,
      0,
      RAMP[0],
      0.25,
      RAMP[1],
      0.5,
      RAMP[2],
      0.75,
      RAMP[3],
      1,
      RAMP[4],
    ] as never);
    map.setPaintProperty('prov-3d', 'fill-extrusion-height', (threeD ? ['*', value, HEIGHT] : 0) as never);
  }, [metric, threeD, ready, max]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.easeTo({ pitch: threeD ? 52 : 0, bearing: threeD ? -10 : 0, duration: 800 });
  }, [threeD, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty('titik', 'visibility', points ? 'visible' : 'none');
  }, [points, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setFilter('prov-sorot', ['==', ['get', 'provinsi'], selected ?? '']);
    const p = selected ? byName.get(selected) : null;
    if (p) map.flyTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 4.6), duration: 900 });
  }, [selected, ready, byName]);

  const sel = selected ? byName.get(selected) : null;
  const selItems = useMemo(
    () => (sel ? items.filter((i) => i.provinsi === sel.provinsi) : []),
    [items, sel],
  );
  const hiddenOpen = selItems
    .filter((i) => i.kepekaan === 'terbuka' && i.rank !== null)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .slice(0, 6);
  const peka = selItems.filter((i) => i.kepekaan === 'perlu_persetujuan').length;
  const [info, rendah, tinggi] = M.metrics[metric];
  const mix = (Object.keys(t.domainShort) as DomainCode[])
    .map((d) => ({ label: t.domainShort[d], value: selItems.filter((i) => i.domain === d).length }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const mixMax = Math.max(1, ...mix.map((d) => d.value));

  return (
    <div className="peta-wadah">
      <div ref={boxRef} className="peta-kanvas" role="region" aria-label={M.region} />
      {failed && <p className="kosong">{M.failed}</p>}

      <section className="peta-panel peta-kendali" aria-label={M.title}>
        <h1>{M.title}</h1>
        <p>{info}</p>
        <span className="label" style={{ color: 'var(--redup-gelap)', fontWeight: 500 }}>
          {M.chooseMetric}
        </span>
        <div className="segmen segmen-dua" role="group" aria-label={M.chooseMetric}>
          {METRIC_KEYS.map((k) => (
            <button key={k} aria-pressed={metric === k} onClick={() => setMetric(k)}>
              {M.metricNames[k]}
            </button>
          ))}
        </div>
        <div className="legenda-gradien" aria-hidden="true" />
        <div className="legenda-skala">
          <span>{rendah}</span>
          <span>{tinggi}</span>
        </div>
        <label className="sakelar">
          <input type="checkbox" checked={threeD} onChange={(e) => setThreeD(e.target.checked)} />
          {M.threeD}
        </label>
        <label className="sakelar">
          <input type="checkbox" checked={points} onChange={(e) => setPoints(e.target.checked)} />
          {M.points}
        </label>
        <label className="label" htmlFor="pilih-prov" style={{ marginTop: 14 }}>
          {M.chooseProv}
        </label>
        <select
          id="pilih-prov"
          className="pilih"
          value={selected ?? ''}
          onChange={(e) => setSelected(e.target.value || null)}
        >
          <option value="">{M.allProv}</option>
          {[...provinsi]
            .sort((a, b) => a.provinsi.localeCompare(b.provinsi))
            .map((p) => (
              <option key={p.provinsi} value={p.provinsi}>
                {p.provinsi}
              </option>
            ))}
        </select>
      </section>

      {sel && (
        <section className="peta-panel peta-info" aria-label={sel.provinsi}>
          <button className="tutup" onClick={() => setSelected(null)} aria-label={M.closeProfile}>
            ×
          </button>
          <p style={{ color: 'var(--redup-gelap)', marginBottom: 4 }}>{t.common.rank(sel.rank)}</p>
          <h2>{sel.provinsi}</h2>
          <p style={{ color: 'var(--kunyit-2)', margin: 0 }}>{t.tipologi(sel.tipologi)}</p>
          <div className="statistik-mini">
            {(['IKD', 'K', 'V', 'A'] as Metric[]).map((k) => (
              <div key={k}>
                <b>{f.dec(sel[k], 2)}</b>
                <span>{M.metricNames[k]}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.92rem' }}>
            {M.summary(
              f.num(sel.n),
              sel.tanpaArtikel !== null ? f.pct(sel.tanpaArtikel, 0) : '',
              f.num(sel.museum),
              f.num(sel.situs),
              f.compact(sel.wisnus),
            )}
            {peka > 0 && ` ${M.sensitive(f.num(peka))}`}
          </p>
          {mix.length > 0 && (
            <>
              <p className="label" style={{ marginTop: 14 }}>
                {M.domainMix}
              </p>
              <div className="bagian-gelap" style={{ background: 'transparent' }}>
                <Bars data={mix.map((d) => ({ ...d, display: f.num(d.value) }))} max={mixMax} />
              </div>
            </>
          )}
          <p className="label" style={{ marginTop: 16 }}>
            {M.hiddenOpen}
          </p>
          <ul className="daftar">
            {hiddenOpen.map((w) => (
              <li key={w.id}>
                <Link className="baris" href={`/warisan/${w.id}`}>
                  <span className="baris-nama" style={{ fontSize: '1rem' }}>
                    {w.nama}
                  </span>
                  <Meter value={w.IKD} />
                </Link>
              </li>
            ))}
            {!hiddenOpen.length && <li className="baris-sub">{M.loadingList}</li>}
          </ul>
          <div className="aksi-baris" style={{ marginTop: 14 }}>
            <Link className="tombol tombol-utama tombol-kecil" href={`/jalur?tujuan=${encodeURIComponent(sel.provinsi)}`}>
              {t.common.planVisit}
            </Link>
            <Link
              className="tombol tombol-garis tombol-kecil"
              href={`/dasbor?provinsi=${encodeURIComponent(sel.provinsi)}`}
              style={{ color: 'var(--kapas)' }}
            >
              {t.common.regionalDash}
            </Link>
          </div>
          {dkiApprox && sel.provinsi === 'DKI Jakarta' && (
            <p className="catatan" style={{ color: 'var(--redup-gelap)', marginTop: 12 }}>
              {M.approx}
            </p>
          )}
        </section>
      )}

      {hover && (
        <div className="label-titik" style={{ left: hover.x + 14, top: hover.y - 10 }}>
          <strong>{hover.name}</strong>
          <span>
            {M.metricNames[metric]} {f.dec(byName.get(hover.name)?.[metric] ?? 0, 2)}
          </span>
        </div>
      )}
      <p className="peta-atribusi">
        {M.attribution} <a href="https://www.geoboundaries.org">geoBoundaries</a> (CC BY 4.0). {M.attrPoints}{' '}
        <a href="https://www.wikidata.org">Wikidata</a>, <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>.
      </p>
    </div>
  );
}
