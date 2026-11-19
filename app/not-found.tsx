import Link from 'next/link';
import { getI18n } from '@/lib/lang-server';

export default async function NotFound() {
  const { lang } = await getI18n();
  const en = lang === 'en';
  return (
    <section className="halaman-kepala" style={{ minHeight: '60vh', display: 'grid', alignItems: 'center' }}>
      <div className="wadah">
        <h1>{en ? 'This page has not been revealed' : 'Halaman ini belum tersingkap'}</h1>
        <p style={{ marginBottom: 24 }}>
          {en
            ? 'The address you opened does not exist. The link may be mistyped or out of date.'
            : 'Alamat yang kamu buka tidak ada. Mungkin tautannya keliru atau sudah berubah.'}
        </p>
        <Link href="/jelajah" className="tombol tombol-utama">
          {en ? 'Search in Explore heritage' : 'Cari di Jelajah warisan'}
        </Link>
      </div>
    </section>
  );
}
