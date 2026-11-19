import type { Metadata } from 'next';
import DasborApp from '@/components/DasborApp';
import { PROVINSI } from '@/lib/data';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dasbor.title, description: t.dasbor.lead };
}

export default async function DasborPage(props: { searchParams: Promise<{ provinsi?: string }> }) {
  const searchParams = await props.searchParams;
  const { t } = await getI18n();
  const initial = PROVINSI.some((p) => p.provinsi === searchParams.provinsi) ? searchParams.provinsi : 'Jawa Timur';
  return (
    <>
      <header className="halaman-kepala">
        <div className="wadah">
          <h1>{t.dasbor.title}</h1>
          <p>{t.dasbor.lead}</p>
        </div>
      </header>
      <div className="wadah isi">
        <DasborApp provinsi={PROVINSI} initial={initial} />
      </div>
    </>
  );
}
