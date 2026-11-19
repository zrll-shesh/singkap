// Menyiapkan aset statis: worker MapLibre, onnxruntime-web, dan contoh foto rumah adat.
// Dijalankan otomatis saat `npm install` dan `npm run build`. Kegagalan unduhan tidak menggagalkan build.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const root = process.cwd();
const require = createRequire(import.meta.url);

const maplibreDist = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist');
mkdirSync(join(root, 'public', 'maplibre'), { recursive: true });
copyFileSync(join(maplibreDist, 'maplibre-gl-worker.mjs'), join(root, 'public', 'maplibre', 'maplibre-gl-worker.mjs'));
console.log('Worker MapLibre disalin ke public/maplibre');

const ortDist = join(root, 'node_modules', 'onnxruntime-web', 'dist');
mkdirSync(join(root, 'public', 'ort'), { recursive: true });
for (const f of ['ort.min.js', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  copyFileSync(join(ortDist, f), join(root, 'public', 'ort', f));
}
console.log('onnxruntime-web disalin ke public/ort');

const samples = JSON.parse(readFileSync(join(root, 'data', 'sampel_rumah_adat.json'), 'utf8'));
mkdirSync(join(root, 'public', 'samples'), { recursive: true });
let ok = 0;
for (const s of samples) {
  const target = join(root, 'public', s.lokal);
  if (existsSync(target)) {
    ok++;
    continue;
  }
  try {
    const res = await fetch(s.url, {
      headers: { 'User-Agent': 'SINGKAP/1.0 (BUDAYA GO! student project)' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(String(res.status));
    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    ok++;
  } catch (e) {
    console.warn(`Contoh foto ${s.kelas} gagal diunduh (${e.message}); peramban akan memuatnya langsung dari Wikimedia.`);
  }
}
console.log(`Contoh foto rumah adat siap: ${ok} dari ${samples.length}`);
