import Link from 'next/link';
import { getI18n } from '@/lib/lang-server';

export default async function SiteFooter() {
  const { t } = await getI18n();
  const L = t.footer.links;
  return (
    <footer className="kaki">
      <div className="wadah kaki-grid">
        <div>
          <h2>SINGKAP</h2>
          <p>{t.footer.about}</p>
          <p>{t.footer.team}</p>
        </div>
        <div>
          <h2>{t.footer.explore}</h2>
          <ul>
            <li><Link href="/peta">{L.peta}</Link></li>
            <li><Link href="/jalur">{L.jalur}</Link></li>
            <li><Link href="/jelajah">{L.jelajah}</Link></li>
            <li><Link href="/kenali">{L.kenali}</Link></li>
            <li><Link href="/dasbor">{L.dasbor}</Link></li>
            <li><Link href="/metodologi">{L.metodologi}</Link></li>
            <li><Link href="/tentang">{L.tentang}</Link></li>
          </ul>
        </div>
        <div>
          <h2>{t.footer.sources}</h2>
          <ul>
            <li><a href="https://id.wikipedia.org">Wikipedia (CC BY-SA 4.0)</a></li>
            <li><a href="https://www.wikidata.org">Wikidata (CC0)</a></li>
            <li><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap (ODbL)</a></li>
            <li><a href="https://www.geoboundaries.org">geoBoundaries (CC BY 4.0)</a></li>
            <li><a href="https://commons.wikimedia.org">Wikimedia Commons</a></li>
            <li><a href="https://www.bps.go.id">Badan Pusat Statistik</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
