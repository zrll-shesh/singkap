// Menyalin worker MapLibre ke folder public agar dapat dimuat oleh peramban (dijalankan otomatis saat install dan build).
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('maplibre-gl/package.json'));
const target = join(process.cwd(), 'public', 'maplibre');
mkdirSync(target, { recursive: true });
copyFileSync(join(dist, 'dist', 'maplibre-gl-worker.mjs'), join(target, 'maplibre-gl-worker.mjs'));
console.log('MapLibre worker disalin ke public/maplibre');
