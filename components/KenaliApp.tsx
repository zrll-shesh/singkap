'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Bars from './Bars';
import { useI18n } from './I18nProvider';

const ORT_VERSION = '1.20.1';
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

interface Labels {
  kelas: { indeks: number; nama: string; provinsi: string }[];
  praproses: { resize: number; center_crop: number; mean: number[]; std: number[] };
  metrik: { akurasi_top1_uji: number; akurasi_top3_uji: number; f1_makro_uji: number; n_uji: number };
}

interface OrtLike {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  InferenceSession: { create: (url: string, opts: object) => Promise<OrtSession> };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => unknown;
}
interface OrtSession {
  run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: Float32Array }>>;
}

declare global {
  interface Window {
    ort?: OrtLike;
  }
}

function loadOrt(): Promise<OrtLike> {
  if (window.ort) return Promise.resolve(window.ort);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `${ORT_BASE}ort.min.js`;
    s.async = true;
    s.onload = () => (window.ort ? resolve(window.ort) : reject(new Error('ort')));
    s.onerror = () => reject(new Error('ort'));
    document.head.appendChild(s);
  });
}

function preprocess(img: HTMLImageElement, p: Labels['praproses']): Float32Array {
  const size = p.center_crop;
  const scale = p.resize / Math.min(img.naturalWidth, img.naturalHeight);
  const crop = size / scale;
  const sx = (img.naturalWidth - crop) / 2;
  const sy = (img.naturalHeight - crop) / 2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, crop, crop, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const out = new Float32Array(3 * size * size);
  const plane = size * size;
  for (let i = 0; i < plane; i++) {
    for (let ch = 0; ch < 3; ch++) {
      out[ch * plane + i] = (data[i * 4 + ch] / 255 - p.mean[ch]) / p.std[ch];
    }
  }
  return out;
}

export default function KenaliApp() {
  const { t, f } = useI18n();
  const K = t.kenali;
  const [labels, setLabels] = useState<Labels | null>(null);
  const [status, setStatus] = useState<'siap' | 'memuat' | 'menganalisis' | 'galat'>('siap');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ nama: string; provinsi: string; p: number }[] | null>(null);
  const [drag, setDrag] = useState(false);
  const session = useRef<OrtSession | null>(null);
  const ortRef = useRef<OrtLike | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/models/labels.json')
      .then((r) => r.json())
      .then(setLabels)
      .catch(() => setStatus('galat'));
  }, []);

  const ensureSession = useCallback(async () => {
    if (session.current) return session.current;
    setStatus('memuat');
    const ort = await loadOrt();
    ort.env.wasm.wasmPaths = ORT_BASE;
    ort.env.wasm.numThreads = 1;
    ortRef.current = ort;
    session.current = await ort.InferenceSession.create('/models/rumah_adat.onnx', { executionProviders: ['wasm'] });
    return session.current;
  }, []);

  async function analyze(file: File) {
    if (!labels || !file.type.startsWith('image/')) return;
    setResult(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const s = await ensureSession();
      setStatus('menganalisis');
      const input = preprocess(img, labels.praproses);
      const ort = ortRef.current!;
      const out = await s.run({ input: new ort.Tensor('float32', input, [1, 3, labels.praproses.center_crop, labels.praproses.center_crop]) });
      const logits = Array.from(out.logits.data);
      const m = Math.max(...logits);
      const exps = logits.map((v) => Math.exp(v - m));
      const sum = exps.reduce((a, b) => a + b, 0);
      const probs = exps.map((v) => v / sum);
      setResult(
        labels.kelas
          .map((k) => ({ nama: k.nama, provinsi: k.provinsi, p: probs[k.indeks] }))
          .sort((a, b) => b.p - a.p)
          .slice(0, 3),
      );
      setStatus('siap');
    } catch {
      setStatus('galat');
    }
  }

  const top = result?.[0];

  return (
    <div className="detail-grid">
      <div>
        <div
          className="unggah"
          data-aktif={drag}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) analyze(f);
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={K.preview} className="pratinjau" />
          ) : (
            <div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', marginBottom: 6 }}>{K.drop}</p>
              <p className="redup">{K.dropNote}</p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analyze(f);
            e.target.value = '';
          }}
        />
        <div className="aksi-baris" style={{ marginTop: 14 }}>
          <button className="tombol tombol-gelap" onClick={() => inputRef.current?.click()} disabled={status === 'memuat' || status === 'menganalisis'}>
            {preview ? K.another : K.choose}
          </button>
        </div>
      </div>

      <section className="panel" aria-live="polite">
        {status === 'memuat' && <p>{K.loadingModel}</p>}
        {status === 'menganalisis' && <p>{K.analyzing}</p>}
        {status === 'galat' && <p>{K.error}</p>}
        {!result && status === 'siap' && (
          <>
            <h2 style={{ fontSize: '1.5rem' }}>{K.classes}</h2>
            <ul className="keping-grup" style={{ listStyle: 'none', padding: 0 }}>
              {labels?.kelas.map((k) => (
                <li key={k.nama} className="status status-netral">
                  {k.nama}, {k.provinsi}
                </li>
              ))}
            </ul>
          </>
        )}
        {result && top && (
          <>
            <p className="redup" style={{ marginBottom: 4 }}>
              {top.p >= 0.5 ? K.likely : K.unsure}
            </p>
            <h2 style={{ fontSize: 'var(--step-3)' }}>{top.nama}</h2>
            <p>{K.from(top.provinsi)}</p>
            <Bars data={result.map((r, i) => ({ label: r.nama, value: r.p, display: f.pct(r.p, 0), tone: i === 0 ? 'kunyit' : 'tarum' }))} />
            <div className="aksi-baris" style={{ marginTop: 16 }}>
              <Link className="tombol tombol-utama tombol-kecil" href={`/jelajah?provinsi=${encodeURIComponent(top.provinsi)}`}>
                {K.more(top.provinsi)}
              </Link>
              <Link className="tombol tombol-garis tombol-kecil" href={`/tanya?q=${encodeURIComponent(K.askPrompt(top.nama))}`}>
                {K.ask(top.nama)}
              </Link>
            </div>
          </>
        )}
        {labels && (
          <p className="catatan" style={{ marginTop: 20 }}>
            {K.card(labels.metrik.n_uji, f.pct(labels.metrik.akurasi_top1_uji, 0), f.pct(labels.metrik.akurasi_top3_uji, 0))}{' '}
            <a href="/data/atribusi_gambar.csv">{K.attribution}</a>.
          </p>
        )}
      </section>
    </div>
  );
}
