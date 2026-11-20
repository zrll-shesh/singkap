import Link from 'next/link';
import FogHero from '@/components/FogHero';
import Bars from '@/components/Bars';
import { YearChart } from '@/components/Charts';
import RandomButton from '@/components/RandomButton';
import Meter from '@/components/Meter';
import { PROVINSI, RINGKASAN, WARISAN, hiddenOpen } from '@/lib/data';
import { getI18n } from '@/lib/lang-server';
import type { DomainCode } from '@/lib/types';

export default async function Beranda() {
  const { t, f, lang } = await getI18n();
  const H = t.home;
  const R = RINGKASAN;
  const perProv = new Map<string, number>();
  const hidden = hiddenOpen(400).filter((w) => {
    const c = perProv.get(w.provinsi) ?? 0;
    perProv.set(w.provinsi, c + 1);
    return c < 1;
  });
  const week = Math.floor(Date.now() / 604_800_000);
  const spot = hidden[week % Math.min(hidden.length, 12)];
  const spotProv = PROVINSI.find((p) => p.provinsi === spot.provinsi)!;
  const others = hidden.filter((h) => h.id !== spot.id).slice(0, 7);
  const ranked = [...PROVINSI].sort((a, b) => a.rank - b.rank);
  const topProv = ranked.slice(0, 5);
  const maxIkd = ranked[0].IKD;
  const domainBars = (Object.keys(t.domainShort) as DomainCode[])
    .map((d) => ({ label: t.domainShort[d], value: R.domain[d]?.tanpa ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .map((d) => ({ ...d, display: f.pct(d.value, 0) }));
  const rec = R.rekomendasi;
  const makna = (id: string) => {
    const x = R.insights.find((i) => i.id === id);
    const m = lang === 'en' ? x?.makna_en : x?.makna;
    return m ? <p className="makna">{m}</p> : null;
  };
  const baru = R.insights.find((i) => i.id === 'penetapan_baru');
  const half = Math.max(1, Math.round(R.medianPv));
  const feat = H.feat;
  const featList: [string, [string, string]][] = [
    ['/peta', feat.peta as [string, string]],
    ['/jalur', feat.jalur(f.pct(rec.dasar.porsi_5_terlihat, 0), f.pct(rec.terpilih.porsi_5_terlihat, 0)) as [string, string]],
    ['/kenali', feat.kenali(R.cvAktif.kelas) as [string, string]],
    ['/tanya', feat.tanya(f.num(WARISAN.length)) as [string, string]],
    ['/dasbor', feat.dasbor as [string, string]],
    ['/jelajah', feat.jelajah as [string, string]],
  ];

  return (
    <>
      <section className="pahlawan" aria-labelledby="judul-utama">
        <FogHero />
        <div className="wadah pahlawan-isi">
          <h1 id="judul-utama">{H.title}</h1>
          <p className="pahlawan-lead">{H.lead}</p>
          <div className="pahlawan-aksi">
            <Link href="/peta" className="tombol tombol-utama">
              {H.ctaMap}
            </Link>
            <Link href="/jalur" className="tombol tombol-garis">
              {H.ctaTrip}
            </Link>
          </div>
          <div className="petunjuk">
            <span>
              <span className="titik-legenda" style={{ background: '#f6cf7d' }} />
              {H.legendHidden}
            </span>
            <span>
              <span className="titik-legenda" style={{ background: 'rgba(198,208,245,.7)' }} />
              {H.legendSeen}
            </span>
            <span>{H.count(f.num(R.n))}</span>
          </div>
        </div>
      </section>

      <section className="cara-kerja" aria-labelledby="judul-cara-kerja">
        <div className="wadah">
          <h2 id="judul-cara-kerja" className="sr-only">
            {H.howTitle}
          </h2>
          <ol>
            {H.howSteps.map(([judul, isi], i) => (
              <li key={judul}>
                <span className="cara-no" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <strong>{judul}</strong>
                  <p>{isi}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bagian" aria-labelledby="judul-temuan">
        <div className="wadah">
          <div className="bagian-kepala">
            <h2 id="judul-temuan">{H.findingsTitle}</h2>
            <p className="redup">{H.findingsLead(f.num(R.n))}</p>
          </div>
          <div className="temuan">
            <article>
              <h3>{H.f1Title(f.pct(R.tanpaArtikel, 0))}</h3>
              <p>{H.f1Body}</p>
              <div className="temuan-vis">
                <Bars
                  data={[
                    { label: H.f1Id, value: R.tanpaArtikel, display: f.pct(R.tanpaArtikel) },
                    { label: H.f1En, value: R.tanpaEn, display: f.pct(R.tanpaEn), tone: 'mengkudu' },
                  ]}
                />
                <p className="catatan">{H.f1Note}</p>
              </div>
              {makna('ketakterlihatan')}
            </article>
            <article>
              <h3>{H.f2Title}</h3>
              <p>{H.f2Body(f.pct(R.top10, 0), f.num(half))}</p>
              <div className="temuan-vis">
                <Bars
                  data={[
                    { label: H.f2Top, value: R.top10, display: f.pct(R.top10, 0) },
                    { label: H.f2Rest, value: 1 - R.top10, display: f.pct(1 - R.top10, 0), tone: 'tarum' },
                  ]}
                />
                <p className="catatan">{H.f2Note(f.dec(R.gini))}</p>
              </div>
              {makna('ketimpangan_perhatian')}
            </article>
            <article>
              <h3>{H.f3Title(domainBars[0].label)}</h3>
              <p>{H.f3Body}</p>
              <div className="temuan-vis">
                <Bars data={domainBars} />
                <p className="catatan">{H.f3Note}</p>
              </div>
              {makna('domain')}
            </article>
            <article>
              <h3>{H.f4Title}</h3>
              <p>{H.f4Body}</p>
              <ol className="daftar temuan-vis">
                {topProv.map((p) => (
                  <li key={p.provinsi}>
                    <Link className="baris" href={`/peta?provinsi=${encodeURIComponent(p.provinsi)}`}>
                      <span>
                        <span className="baris-nama">{p.provinsi}</span>
                        <span className="baris-sub" style={{ display: 'block' }}>
                          {H.f4Row(f.num(p.n), f.compact(p.wisnus))}
                        </span>
                      </span>
                      <Meter value={p.IKD} />
                    </Link>
                  </li>
                ))}
              </ol>
              {makna('kekayaan_visibilitas')}
            </article>
          </div>
          {baru && (
            <div style={{ marginTop: 48 }}>
              <YearChart
                rows={R.grafik.perTahun}
                title={lang === 'en' ? baru.judul_en ?? baru.judul : baru.judul}
                caption={H.yearCaption}
              />
              {makna('penetapan_baru')}
            </div>
          )}
        </div>
      </section>

      <section className="bagian bagian-gelap" style={{ paddingBlock: '72px' }} aria-labelledby="judul-strip">
        <div className="wadah">
          <h2 id="judul-strip" style={{ fontSize: 'var(--step-2)' }}>
            {H.stripTitle}
          </h2>
          <p className="redup sempit">{H.stripNote}</p>
          <div className="strip" role="list">
            {ranked.map((p, i) => (
              <Link
                key={p.provinsi}
                role="listitem"
                href={`/peta?provinsi=${encodeURIComponent(p.provinsi)}`}
                className={i < 5 ? 'atas' : ''}
                style={{ height: `${Math.max(3, (p.IKD / maxIkd) * 100)}%` }}
                aria-label={`${p.provinsi}, ${t.common.ikd} ${f.dec(p.IKD)}`}
              >
                <span>
                  {p.provinsi} {f.dec(p.IKD)}
                </span>
              </Link>
            ))}
          </div>
          <div className="strip-sumbu">
            <span>{ranked[0].provinsi}</span>
            <span>{ranked[ranked.length - 1].provinsi}</span>
          </div>
          <p style={{ marginTop: 32 }}>
            <Link href="/metodologi" className="tombol tombol-utama">
              {H.allFindings}
            </Link>
          </p>
        </div>
      </section>

      <section className="bagian" aria-labelledby="judul-sorotan">
        <div className="wadah sorotan">
          <div>
            <p className="redup" id="judul-sorotan">
              {H.spotEyebrow}
            </p>
            <h2 className="sorotan-nama">{spot.nama}</h2>
            <p className="sorotan-meta" style={{ color: 'var(--redup)' }}>
              {H.spotMeta(spot.provinsi, spot.tahun, spot.domain ? t.domainShort[spot.domain] : '')}
            </p>
            <ul className="alasan">
              <li>{spot.artikel ? H.spotReasonViews(f.num(spot.pv)) : H.spotReasonNoArticle}</li>
              <li>{spot.en ? H.spotReasonEnOk : H.spotReasonEn}</li>
              <li>{H.spotReasonProv(spot.provinsi, spotProv.rank)}</li>
            </ul>
            <div className="pahlawan-aksi">
              <Link href={`/warisan/${spot.id}`} className="tombol tombol-utama">
                {H.spotCta(spot.nama)}
              </Link>
              <Link href={`/jalur?tujuan=${encodeURIComponent(spot.provinsi)}`} className="tombol tombol-garis">
                {H.spotTrip}
              </Link>
            </div>
            <p style={{ marginTop: 14 }}>
              <RandomButton ids={hiddenOpen(300).map((w) => w.id)} label={H.random} className="tautan-tombol" />
            </p>
          </div>
          <div>
            <p className="redup">{H.spotOthers}</p>
            <ul className="daftar">
              {others.map((w) => (
                <li key={w.id}>
                  <Link className="baris" href={`/warisan/${w.id}`}>
                    <span>
                      <span className="baris-nama">{w.nama}</span>
                      <span className="baris-sub" style={{ display: 'block' }}>
                        {w.provinsi}
                        {w.domain ? `, ${t.domainShort[w.domain].toLowerCase()}` : ''}
                      </span>
                    </span>
                    <Meter value={w.IKD} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bagian" style={{ paddingTop: 0 }} aria-labelledby="judul-fitur">
        <div className="wadah">
          <div className="bagian-kepala">
            <h2 id="judul-fitur">{H.featTitle}</h2>
            <p className="redup">{H.featLead}</p>
          </div>
          <nav className="fitur" aria-label="SINGKAP">
            {featList.map(([href, [title, body]]) => (
              <Link key={href} href={href}>
                <strong>{title}</strong>
                <span>{body}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="bagian" style={{ paddingTop: 0 }} aria-labelledby="judul-peka">
        <div className="wadah peka">
          <p className="peka-kutip" id="judul-peka" lang={lang}>
            {H.ethicsQuote}
          </p>
          <div>
            <p>{H.ethicsBody(f.pct(R.perluPersetujuan, 0))}</p>
            <p className="redup">{H.ethicsBody2}</p>
            <Link href="/tentang" className="tombol tombol-gelap">
              {H.ethicsCta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
