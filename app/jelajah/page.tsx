import type { Metadata } from 'next';
import JelajahApp from '@/components/JelajahApp';
import { PROVINSI, RINGKASAN } from '@/lib/data';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.jelajah.title };
}

export default async function JelajahPage(props: { searchParams: Promise<{ provinsi?: string }> }) {
  const searchParams = await props.searchParams;
  const { t, f } = await getI18n();
  const names = PROVINSI.map((p) => p.provinsi).sort((a, b) => a.localeCompare(b));
  return (
    <>
      <header className="halaman-kepala">
        <div className="wadah">
          <h1>{t.jelajah.title}</h1>
          <p>{t.jelajah.lead(f.num(RINGKASAN.n))}</p>
        </div>
      </header>
      <div className="wadah isi">
        <JelajahApp provinsi={names} initialProv={names.includes(searchParams.provinsi ?? '') ? searchParams.provinsi : undefined} />
      </div>
    </>
  );
}
