import type { Metadata } from 'next';
import JalurApp from '@/components/JalurApp';
import { PROVINSI, RINGKASAN } from '@/lib/data';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.jalur.title };
}

export default async function JalurPage(props: { searchParams: Promise<{ tujuan?: string }> }) {
  const searchParams = await props.searchParams;
  const { t, f } = await getI18n();
  const ramai = [...PROVINSI].sort((a, b) => b.wisnus - a.wisnus).slice(0, 5).map((p) => p.provinsi);
  const r = RINGKASAN.rekomendasi;
  return (
    <>
      <header className="halaman-kepala">
        <div className="wadah">
          <h1>{t.jalur.title}</h1>
          <p>{t.jalur.lead(f.pct(r.dasar.porsi_5_terlihat), f.pct(r.terpilih.porsi_5_terlihat))}</p>
        </div>
      </header>
      <div className="wadah isi">
        <JalurApp initialTujuan={searchParams.tujuan} ramai={ramai} />
      </div>
    </>
  );
}
