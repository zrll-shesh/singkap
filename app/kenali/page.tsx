import type { Metadata } from 'next';
import KenaliApp from '@/components/KenaliApp';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.kenali.title, description: t.kenali.lead };
}

export default async function KenaliPage() {
  const { t } = await getI18n();
  return (
    <>
      <header className="halaman-kepala">
        <div className="wadah">
          <h1>{t.kenali.title}</h1>
          <p>{t.kenali.lead}</p>
        </div>
      </header>
      <div className="wadah isi">
        <KenaliApp />
      </div>
    </>
  );
}
