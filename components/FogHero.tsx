'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { WarisanLite } from '@/lib/types';
import { useI18n } from './I18nProvider';

type Ring = number[][];
interface Feature {
  properties: { provinsi: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: Ring[] | Ring[][] };
}
interface Dot {
  x: number;
  y: number;
  lon: number;
  lat: number;
  h: number;
  item: WarisanLite;
}

const BOUNDS = { lon0: 94.6, lon1: 141.2, lat0: 6.4, lat1: -11.2 };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function polygons(f: Feature): Ring[][] {
  return f.geometry.type === 'Polygon' ? [f.geometry.coordinates as Ring[]] : (f.geometry.coordinates as Ring[][]);
}

function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function randomPoint(f: Feature, rand: () => number): [number, number] {
  const polys = polygons(f);
  let best = polys[0];
  let area = 0;
  for (const p of polys) {
    const xs = p[0].map((c) => c[0]);
    const ys = p[0].map((c) => c[1]);
    const a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    if (a > area) {
      area = a;
      best = p;
    }
  }
  const xs = best[0].map((c) => c[0]);
  const ys = best[0].map((c) => c[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let k = 0; k < 60; k++) {
    const lon = x0 + rand() * (x1 - x0);
    const lat = y0 + rand() * (y1 - y0);
    if (inRing(lon, lat, best[0])) return [lon, lat];
  }
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}

export default function FogHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [label, setLabel] = useState<{ x: number; y: number; item: WarisanLite } | null>(null);
  const router = useRouter();
  const { t } = useI18n();
  const dotsRef = useRef<Dot[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let features: Feature[] = [];
    let items: WarisanLite[] = [];
    let base: HTMLCanvasElement | null = null;
    let fogTex: HTMLCanvasElement | null = null;
    let fog: HTMLCanvasElement | null = null;
    let mask: HTMLCanvasElement | null = null;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let scale = 1;
    let offX = 0;
    let offY = 0;
    let raf = 0;
    let visible = true;
    let pointer: { x: number; y: number } | null = null;
    const sweepStart = performance.now();
    let cancelled = false;

    const project = (lon: number, lat: number) => [offX + (lon - BOUNDS.lon0) * scale, offY + (BOUNDS.lat0 - lat) * scale];

    function layout() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      const spanLon = BOUNDS.lon1 - BOUNDS.lon0;
      const spanLat = BOUNDS.lat0 - BOUNDS.lat1;
      const pad = w < 700 ? 0.04 : 0.06;
      scale = Math.min((w * (1 - 2 * pad)) / spanLon, (h * 0.78) / spanLat);
      offX = (w - spanLon * scale) / 2;
      offY = w < 700 ? h * 0.12 : (h - spanLat * scale) * 0.32;
      buildLayers();
    }

    function makeCanvas() {
      const c = document.createElement('canvas');
      c.width = w * dpr;
      c.height = h * dpr;
      const x = c.getContext('2d')!;
      x.scale(dpr, dpr);
      return [c, x] as const;
    }

    function buildLayers() {
      const [b, bx] = makeCanvas();
      bx.fillStyle = '#1f2a55';
      bx.fillRect(0, 0, w, h);
      for (const f of features) {
        for (const poly of polygons(f)) {
          bx.beginPath();
          for (const ring of poly) {
            ring.forEach(([lon, lat], i) => {
              const [x, y] = project(lon, lat);
              if (i === 0) bx.moveTo(x, y);
              else bx.lineTo(x, y);
            });
            bx.closePath();
          }
          bx.fillStyle = '#2a3870';
          bx.fill('evenodd');
          bx.strokeStyle = 'rgba(190, 202, 245, 0.18)';
          bx.lineWidth = 0.6;
          bx.stroke();
        }
      }
      const ranked = [...items].filter((i) => i.IKD !== null).sort((a, b) => (a.IKD ?? 0) - (b.IKD ?? 0));
      const pctOf = new Map(ranked.map((it, i) => [it.id, i / Math.max(1, ranked.length - 1)]));
      const byProv = new Map(features.map((f) => [f.properties.provinsi, f]));
      const dots: Dot[] = [];
      for (const it of items) {
        const f = byProv.get(it.provinsi);
        if (!f) continue;
        const [lon, lat] = randomPoint(f, rng(hash(it.id)));
        const [x, y] = project(lon, lat);
        dots.push({ x, y, lon, lat, h: pctOf.get(it.id) ?? 0, item: it });
      }
      dots.sort((a, b) => a.h - b.h);
      for (const d of dots) {
        const r = 0.9 + d.h * 2.1;
        if (d.h > 0.7) {
          const g = bx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 5);
          g.addColorStop(0, 'rgba(246, 207, 125, 0.55)');
          g.addColorStop(1, 'rgba(232, 169, 58, 0)');
          bx.fillStyle = g;
          bx.beginPath();
          bx.arc(d.x, d.y, r * 5, 0, Math.PI * 2);
          bx.fill();
        }
        bx.fillStyle = d.h > 0.7 ? '#f6cf7d' : d.h > 0.4 ? 'rgba(232, 169, 58, 0.75)' : 'rgba(198, 208, 245, 0.55)';
        bx.beginPath();
        bx.arc(d.x, d.y, r, 0, Math.PI * 2);
        bx.fill();
      }
      dotsRef.current = dots;
      base = b;

      const [t, tx] = makeCanvas();
      tx.fillStyle = 'rgba(31, 42, 85, 0.93)';
      tx.fillRect(0, 0, w, h);
      const rand = rng(7);
      for (let i = 0; i < 140; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 60 + rand() * 220;
        const g = tx.createRadialGradient(x, y, 0, x, y, r);
        const light = rand() > 0.45;
        g.addColorStop(0, light ? 'rgba(120, 136, 196, 0.16)' : 'rgba(18, 24, 52, 0.22)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        tx.fillStyle = g;
        tx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      fogTex = t;
      fog = makeCanvas()[0];
      mask = makeCanvas()[0];
    }

    // Kabut digambar ulang dari tekstur setiap frame; yang disimpan hanya topeng singkapan (alfa),
    // sehingga tidak ada galat warna yang menumpuk.
    function erase(x: number, y: number, radius: number, strength = 1) {
      if (!mask) return;
      const mx = mask.getContext('2d')!;
      mx.save();
      mx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mx.globalCompositeOperation = 'source-over';
      const g = mx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * strength})`);
      g.addColorStop(0.55, `rgba(255,255,255,${0.45 * strength})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      mx.fillStyle = g;
      mx.beginPath();
      mx.arc(x, y, radius, 0, Math.PI * 2);
      mx.fill();
      mx.restore();
    }

    function regrow(amount: number) {
      if (!mask) return;
      const mx = mask.getContext('2d')!;
      mx.save();
      mx.setTransform(1, 0, 0, 1, 0, 0);
      mx.globalCompositeOperation = 'destination-out';
      mx.fillStyle = `rgba(0,0,0,${amount})`;
      mx.fillRect(0, 0, mask.width, mask.height);
      mx.restore();
    }

    function composeFog() {
      if (!fog || !fogTex || !mask) return;
      const fx = fog.getContext('2d')!;
      fx.save();
      fx.setTransform(1, 0, 0, 1, 0, 0);
      fx.globalCompositeOperation = 'copy';
      fx.drawImage(fogTex, 0, 0);
      fx.globalCompositeOperation = 'destination-out';
      fx.drawImage(mask, 0, 0);
      fx.restore();
    }

    function frame(now: number) {
      raf = 0;
      if (!base || !fog || !visible || cancelled) return;
      const sweep = (now - sweepStart) / 2600;
      if (!reduce && sweep < 1) {
        const ease = 1 - Math.pow(1 - sweep, 3);
        const x = offX + ease * (w - 2 * offX);
        const y = h * 0.42 + Math.sin(ease * Math.PI * 2.2) * h * 0.12;
        erase(x, y, Math.max(90, w * 0.09), 0.55);
      }
      if (pointer) erase(pointer.x, pointer.y, Math.max(80, Math.min(150, w * 0.1)));
      if (!reduce) regrow(0.015);
      composeFog();
      const progress = Math.min(1, Math.max(0, window.scrollY / (h * 0.8)));
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.fillStyle = '#1f2a55';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx!.drawImage(base, 0, 0);
      ctx!.globalAlpha = reduce ? 0.55 : 1 - progress * 0.75;
      ctx!.drawImage(fog, 0, 0);
      ctx!.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function nearest(x: number, y: number): Dot | null {
      let best: Dot | null = null;
      let bd = 14 * 14;
      for (const d of dotsRef.current) {
        if (d.h < 0.55) continue;
        const dd = (d.x - x) ** 2 + (d.y - y) ** 2;
        if (dd < bd) {
          bd = dd;
          best = d;
        }
      }
      return best;
    }

    function onMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      const d = nearest(pointer.x, pointer.y);
      setLabel(d ? { x: d.x, y: d.y, item: d.item } : null);
      canvas!.style.cursor = d ? 'pointer' : 'default';
      kick();
    }

    function onLeave() {
      pointer = null;
    }

    function onClick(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect();
      const d = nearest(e.clientX - r.left, e.clientY - r.top);
      if (d) router.push(`/warisan/${d.item.id}`);
    }

    Promise.all([fetch('/data/provinsi.geojson').then((r) => r.json()), fetch('/data/warisan.json').then((r) => r.json())])
      .then(([gj, ws]) => {
        if (cancelled) return;
        features = gj.features;
        items = ws;
        layout();
        kick();
      })
      .catch(() => undefined);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      if (features.length) {
        layout();
        kick();
      }
    });
    ro.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click', onClick);
    window.addEventListener('scroll', kick, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('scroll', kick);
    };
  }, [router]);

  return (
    <>
      <canvas ref={canvasRef} aria-label={t.home.canvasLabel} role="img" />
      {label && (
        <div
          className="label-titik"
          style={{ left: Math.min(label.x + 14, (canvasRef.current?.clientWidth ?? 0) - 240), top: Math.max(label.y - 46, 8) }}
        >
          <strong>{label.item.nama}</strong>
          <span>
            {label.item.provinsi}
            {label.item.artikel ? '' : `, ${t.home.noArticle}`}
          </span>
        </div>
      )}
    </>
  );
}
