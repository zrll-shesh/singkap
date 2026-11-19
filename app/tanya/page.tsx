import type { Metadata } from 'next';
import ChatPanel from '@/components/ChatPanel';
import { RINGKASAN, WARISAN } from '@/lib/data';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.tanya.title, description: t.tanya.lead };
}

export default async function TanyaPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const { t, f } = await getI18n();
  const T = t.tanya;
  return (
    <div className="tanya-halaman">
      <aside className="tanya-samping">
        <h1>{T.title}</h1>
        <p>{T.lead}</p>
        <div className="sembunyi-kecil">
          <p>{T.kb(f.num(WARISAN.length))}</p>
          <p>{T.eval(f.num(RINGKASAN.rag.n_pertanyaan_positif), f.pct(RINGKASAN.rag.hit_at_5))}</p>
          <p style={{ color: 'var(--redup-gelap)', fontSize: '0.85rem' }}>{T.caution}</p>
        </div>
      </aside>
      <div className="tanya-utama">
        <ChatPanel initial={searchParams.q?.slice(0, 300)} />
      </div>
    </div>
  );
}
