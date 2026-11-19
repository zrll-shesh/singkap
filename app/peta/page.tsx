import type { Metadata } from 'next';
import MapSingkap from '@/components/MapSingkap';
import { PROVINSI, RINGKASAN } from '@/lib/data';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.map.title, description: t.map.metrics.IKD[0] };
}

export default async function PetaPage(props: { searchParams: Promise<{ provinsi?: string }> }) {
  const searchParams = await props.searchParams;
  const initial = PROVINSI.some((p) => p.provinsi === searchParams.provinsi) ? searchParams.provinsi : undefined;
  return <MapSingkap provinsi={PROVINSI} initial={initial} dkiApprox={Boolean((RINGKASAN as { dkiPerkiraan?: boolean }).dkiPerkiraan)} />;
}
