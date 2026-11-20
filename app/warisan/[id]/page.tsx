import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Bars from '@/components/Bars';
import Status from '@/components/Status';
import ShareButton from '@/components/ShareButton';
import { WARISAN, getProvinsi, getWarisan } from '@/lib/data';
import { wikiUrl } from '@/lib/format';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getI18n();
  const w = getWarisan(params.id);
  if (!w) return { title: t.detail.notFound };
  return { title: w.nama, description: t.detail.metaDesc(w.nama, w.provinsi) };
}

export default async function WarisanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { t, f, lang } = await getI18n();
  const D = t.detail;
  const w = getWarisan(params.id);
  if (!w) notFound();
  const p = getProvinsi(w.provinsi);
  const total = WARISAN.filter((x) => x.rank !== null).length;
  const inProv = WARISAN.filter((x) => x.provinsi === w.provinsi && x.rank !== null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const posInProv = inProv.findIndex((x) => x.id === w.id) + 1;
  const kontak = process.env.NEXT_PUBLIC_KONTAK_EMAIL;
  const koreksi = kontak
    ? `mailto:${kontak}?subject=${encodeURIComponent(`Koreksi data SINGKAP: ${w.nama} (${w.reg})`)}`
    : '/tentang#koreksi';
  const vBars = w.vc.map((v, i) => ({
    label: D.vLabels[i],
    value: v,
    display: i < 4 ? (v > 0 ? D.yes : D.no) : f.dec(v, 2),
    tone: (v > 0 ? 'tarum' : 'mengkudu') as 'tarum' | 'mengkudu',
  }));

  return (
    <>
      <header className="halaman-kepala">
        <div className="wadah">
          <p style={{ marginBottom: 8 }}>
            <Link href={`/jelajah?provinsi=${encodeURIComponent(w.provinsi)}`} style={{ color: 'var(--redup-gelap)' }}>
              {D.from(w.provinsi)}
            </Link>
          </p>
          <h1>{w.nama}</h1>
          <div className="detail-meta">
            <span>{w.provinsi}</span>
            <span>{D.designated(w.tahun)}</span>
            <span>{D.reg(w.reg)}</span>
            {w.domain && <span>{t.domain[w.domain]}</span>}
          </div>
        </div>
      </header>
      <div className="wadah isi detail-grid">
        <article>
          {w.kepekaan === 'perlu_persetujuan' && (
            <div className="peringatan-peka" role="note">
              <strong>{D.sensitiveTitle}</strong> {D.sensitiveBody}
            </div>
          )}
          <h2 style={{ fontSize: 'var(--step-2)' }}>{D.about}</h2>
          {w.ringkasan ? (
            <>
              <p style={{ fontSize: '1.08rem', maxWidth: '64ch' }} lang="id">
                {w.ringkasan}
              </p>
              <p className="catatan">
                <a href={wikiUrl(w.artikel ?? w.nama)} target="_blank" rel="noreferrer">
                  Wikipedia
                </a>
                . {D.wikiNote}
                {lang === 'en' && w.en && (
                  <>
                    {' '}
                    <a href={wikiUrl(w.en, 'en')} target="_blank" rel="noreferrer">
                      English Wikipedia: {w.en}
                    </a>
                  </>
                )}
              </p>
            </>
          ) : (
            <p style={{ maxWidth: '64ch' }}>{D.noArticle(w.nama)}</p>
          )}
          {w.domain && <p className="redup">{D.unsur(t.unsur[w.domain])}</p>}

          <h2 style={{ fontSize: 'var(--step-2)', marginTop: 40 }}>{D.whyTitle}</h2>
          <p className="redup" style={{ maxWidth: '64ch' }}>
            {D.whyLead}
          </p>
          {w.IKD !== null && p ? (
            <>
              <p className="skor-besar">{D.whyScore(f.dec(w.IKD, 2))}</p>
              <Bars
                data={[
                  { label: D.whyBars[0], value: p.K, display: f.dec(p.K), tone: 'kunyit' },
                  { label: D.whyBars[1], value: w.V, display: f.dec(w.V), tone: 'tarum' },
                  { label: D.whyBars[2], value: p.A, display: f.dec(p.A), tone: 'mengkudu' },
                ]}
              />
              <p className="catatan">
                <Link href="/metodologi">{D.howCalc}</Link>
              </p>
            </>
          ) : (
            <p>{D.noIkd}</p>
          )}
          <p style={{ marginTop: 14 }}>
            {w.rank !== null && <>{D.rank(f.num(w.rank), f.num(total))} </>}
            {posInProv > 0 && <>{D.inProvince(posInProv, inProv.length, w.provinsi)} </>}
            {w.artikel ? D.views(f.num(w.pv)) : D.viewsNone}
          </p>
          <h3 style={{ marginTop: 28 }}>{D.vTitle(f.dec(w.V))}</h3>
          <Bars data={vBars} />
        </article>

        <aside className="panel lekat">
          <h2 style={{ fontSize: '1.4rem' }}>{D.status}</h2>
          <p>
            <Status kepekaan={w.kepekaan} />
          </p>
          <div className="aksi-baris" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Link className="tombol tombol-gelap" href={`/tanya?q=${encodeURIComponent(D.askPrompt(w.nama))}`}>
              {D.askAbout}
            </Link>
            {w.kepekaan === 'terbuka' && (
              <Link className="tombol tombol-utama" href={`/jalur?tujuan=${encodeURIComponent(w.provinsi)}`}>
                {D.planTo(w.provinsi)}
              </Link>
            )}
            <Link className="tombol tombol-garis" href={`/peta?provinsi=${encodeURIComponent(w.provinsi)}`}>
              {D.seeMap(w.provinsi)}
            </Link>
            <ShareButton nama={w.nama} />
          </div>
          {p && (
            <>
              <h3 style={{ marginTop: 28 }}>{w.provinsi}</h3>
              <div className="angka-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  <b>{p.rank}</b>
                  <span>{D.provRank}</span>
                </div>
                <div>
                  <b>{f.num(p.n)}</b>
                  <span>{D.provItems}</span>
                </div>
                <div>
                  <b>{f.compact(p.wisnus)}</b>
                  <span>{D.provTrips}</span>
                </div>
              </div>
              <p className="catatan" style={{ marginTop: 10 }}>
                {t.tipologi(p.tipologi)}.
              </p>
            </>
          )}
          <h3 id="koreksi" style={{ marginTop: 28 }}>
            {D.wrong}
          </h3>
          <p className="catatan">{D.wrongBody}</p>
          <a className="tombol tombol-garis tombol-kecil" href={koreksi}>
            {D.wrongCta}
          </a>
          <h3 style={{ marginTop: 28 }}>{D.sources}</h3>
          <ul className="catatan" style={{ paddingLeft: '1.1em' }}>
            <li>
              <a href="https://id.wikipedia.org/wiki/Daftar_Warisan_Budaya_Takbenda_Indonesia">{D.listSource}</a> (CC BY-SA 4.0)
            </li>
            {w.artikel && (
              <li>
                <a href={wikiUrl(w.artikel)}>{D.article(w.artikel)}</a> (CC BY-SA 4.0)
              </li>
            )}
            {w.en && (
              <li>
                <a href={wikiUrl(w.en, 'en')}>English Wikipedia: {w.en}</a>
              </li>
            )}
          </ul>
        </aside>
      </div>
    </>
  );
}
