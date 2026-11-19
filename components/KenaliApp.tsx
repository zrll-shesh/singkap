'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Bars from './Bars';
import { useI18n } from './I18nProvider';
import sampelRaw from '@/data/sampel_rumah_adat.json';

// onnxruntime-web di-host sendiri (disalin ke public/ort oleh scripts/prepare-assets.mjs)
const ORT_BASE = '/ort/';

interface Sampel {
  kelas: string;
  provinsi: string;
  berkas: string;
  lokal: string;
  url: string;
  halaman: string;
  pembuat: string;
  lisensi: string;
}
const SAMPEL = sampelRaw as Sampel[];

interface Labels {
  kelas: { indeks: number; nama: string; provinsi: string }[];
  praproses: { resize: number; center_crop: number; mean: number[]; std: number[] };
  metrik: { akurasi_top1_uji: number; akurasi_top3_uji: number; f1_makro_uji: number; n_uji: number };
  nonaktif?: Record<string, string>;
}

interface OrtSession {
  run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: Float32Array }>>;
}
interface OrtLike {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  InferenceSession: { create: (url: string, opts: object) => Promise<OrtSession> };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => unknown;
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

function preprocess(img: CanvasImageSource & { width: number; height: number }, w: number, h: number, p: Labels['praproses']) {
  const size = p.center_crop;
  const scale = p.resize / Math.min(w, h);
  const crop = size / scale;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (w - crop) / 2, (h - crop) / 2, crop, crop, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const out = new Float32Array(3 * size * size);
  const plane = size * size;
  for (let i = 0; i < plane; i++) {
    for (let ch = 0; ch < 3; ch++) out[ch * plane + i] = (data[i * 4 + ch] / 255 - p.mean[ch]) / p.std[ch];
  }
  return out;
}

function loadImage(src: string, cross: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cross) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('img'));
    img.src = src;
  });
}

function SampelThumb({ s, onPick, disabled }: { s: Sampel; onPick: (s: Sampel) => void; disabled: boolean }) {
  const [src, setSrc] = useState(s.lokal);
  return (
    <button type="button" className="sampel" onClick={() => onPick(s)} disabled={disabled}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" onError={() => src !== s.url && setSrc(s.url)} />
      <span>{s.kelas}</span>
    </button>
  );
}

export default function KenaliApp() {
  const { t, f } = useI18n();
  const K = t.kenali;
  const [labels, setLabels] = useState<Labels | null>(null);
  const [status, setStatus] = useState<'siap' | 'memuat' | 'menganalisis' | 'galat'>('siap');
  const [preview, setPreview] = useState<string | null>(null);
  const [credit, setCredit] = useState<Sampel | null>(null);
  const [result, setResult] = useState<{ nama: string; provinsi: string; p: number }[] | null>(null);
  const [drag, setDrag] = useState(false);
  const [camera, setCamera] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const session = useRef<OrtSession | null>(null);
  const ortRef = useRef<OrtLike | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  async function predict(source: CanvasImageSource & { width: number; height: number }, w: number, h: number) {
    if (!labels) return;
    setResult(null);
    try {
      const s = await ensureSession();
      setStatus('menganalisis');
      const input = preprocess(source, w, h, labels.praproses);
      const size = labels.praproses.center_crop;
      const out = await s.run({ input: new ortRef.current!.Tensor('float32', input, [1, 3, size, size]) });
      const logits = Array.from(out.logits.data);
      const off = new Set(Object.keys(labels.nonaktif ?? {}));
      const active = labels.kelas.filter((k) => !off.has(k.nama));
      const m = Math.max(...active.map((k) => logits[k.indeks]));
      const exps = active.map((k) => Math.exp(logits[k.indeks] - m));
      const sum = exps.reduce((a, b) => a + b, 0);
      setResult(
        active
          .map((k, i) => ({ nama: k.nama, provinsi: k.provinsi, p: exps[i] / sum }))
          .sort((a, b) => b.p - a.p)
          .slice(0, 3),
      );
      setStatus('siap');
    } catch {
      setStatus('galat');
    }
  }

  async function analyzeFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setCredit(null);
    try {
      const img = await loadImage(url, false);
      await predict(img, img.naturalWidth, img.naturalHeight);
    } catch {
      setStatus('galat');
    }
  }

  async function analyzeSample(s: Sampel) {
    setCredit(s);
    setResult(null);
    try {
      let img: HTMLImageElement;
      try {
        img = await loadImage(s.lokal, false);
      } catch {
        img = await loadImage(s.url, true);
      }
      setPreview(img.src);
      await predict(img, img.naturalWidth, img.naturalHeight);
    } catch {
      setStatus('galat');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCamera(false);
  }

  async function startCamera(mode = facing) {
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      captureRef.current?.click();
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setFacing(mode);
      setCamera(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCamError(K.cameraDenied);
    }
  }

  async function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    setPreview(c.toDataURL('image/jpeg', 0.9));
    setCredit(null);
    stopCamera();
    await predict(c, c.width, c.height);
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach((tr) => tr.stop()), []);

  const busy = status === 'memuat' || status === 'menganalisis';
  const top = result?.[0];
  const off = labels?.nonaktif ?? {};
  const samples = SAMPEL.filter((s) => !(s.kelas in off));

  return (
    <div className="detail-grid">
      <div>
        {camera ? (
          <div className="kamera">
            <video ref={videoRef} playsInline muted autoPlay aria-label={K.cameraLive} />
            <div className="aksi-baris kamera-aksi">
              <button className="tombol tombol-utama" onClick={capture}>
                {K.capture}
              </button>
              <button className="tombol tombol-garis" style={{ color: 'var(--kapas)' }} onClick={() => startCamera(facing === 'environment' ? 'user' : 'environment')}>
                {K.flip}
              </button>
              <button className="tombol tombol-garis" style={{ color: 'var(--kapas)' }} onClick={stopCamera}>
                {K.closeCamera}
              </button>
            </div>
          </div>
        ) : (
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
              const file = e.dataTransfer.files?.[0];
              if (file) analyzeFile(file);
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
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) analyzeFile(file);
            e.target.value = '';
          }}
        />
        <input
          ref={captureRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) analyzeFile(file);
            e.target.value = '';
          }}
        />
        {!camera && (
          <div className="aksi-baris" style={{ marginTop: 14 }}>
            <button className="tombol tombol-utama" onClick={() => startCamera()} disabled={busy}>
              {K.openCamera}
            </button>
            <button className="tombol tombol-gelap" onClick={() => inputRef.current?.click()} disabled={busy}>
              {preview ? K.another : K.choose}
            </button>
          </div>
        )}
        {camError && (
          <p className="catatan" role="alert" style={{ marginTop: 10 }}>
            {camError}
          </p>
        )}
        {credit && (
          <p className="catatan" style={{ marginTop: 10 }}>
            {K.credit}{' '}
            <a href={credit.halaman} target="_blank" rel="noreferrer">
              {credit.pembuat}
            </a>
            , {credit.lisensi}, Wikimedia Commons.
          </p>
        )}

        <h2 style={{ fontSize: '1.35rem', marginTop: 32 }}>{K.samplesTitle}</h2>
        <p className="catatan">{K.samplesNote}</p>
        <div className="sampel-grid">
          {samples.map((s) => (
            <SampelThumb key={s.kelas} s={s} onPick={analyzeSample} disabled={busy} />
          ))}
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
              {labels?.kelas
                .filter((k) => !(k.nama in off))
                .map((k) => (
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
              {top.p >= 0.65 ? K.likely : K.unsure}
            </p>
            <h2 style={{ fontSize: 'var(--step-3)' }}>{top.nama}</h2>
            <p>{K.from(top.provinsi)}</p>
            <Bars data={result.map((r, i) => ({ label: r.nama, value: r.p, display: f.pct(r.p, 0), tone: i === 0 ? 'kunyit' : 'tarum' }))} />
            {credit && (
              <p className="catatan" style={{ marginTop: 8 }}>
                {credit.kelas === top.nama ? K.sampleRight(credit.kelas) : K.sampleWrong(credit.kelas)}
              </p>
            )}
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
            {Object.keys(off).length > 0 && K.disabled(Object.keys(off).join(', '))}{' '}
            <a href="/data/atribusi_gambar.csv">{K.attribution}</a>.
          </p>
        )}
      </section>
    </div>
  );
}
