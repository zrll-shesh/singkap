import type { Metadata } from 'next';
import Link from 'next/link';
import { getI18n } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).lang === 'en' ? 'About and ethics' : 'Tentang dan etika' };
}

export default async function TentangPage() {
  const { lang } = await getI18n();
  const L = (id: string, en: string) => (lang === 'en' ? en : id);
  const kontak = process.env.NEXT_PUBLIC_KONTAK_EMAIL;
  return (
    <>
      <header className="halaman-kepala">
        <div className="wadah">
          <h1>{L('Tentang SINGKAP', 'About SINGKAP')}</h1>
          <p>
            {L(
              'Singkap berarti membuka tabir. Kami membangun SINGKAP karena ribuan warisan budaya sudah ditetapkan negara, tetapi sebagian besar belum pernah sampai kepada orang yang mungkin jatuh cinta padanya.',
              'Singkap means to lift a veil. We built SINGKAP because thousands of heritage items have been officially recognised, yet most have never reached the people who might fall in love with them.',
            )}
          </p>
        </div>
      </header>
      <div className="wadah isi prosa">
        <h2 style={{ marginTop: 0 }}>{L('Tim', 'Team')}</h2>
        <ul>
          <li>{L('Nazril, Sains Data, Universitas Negeri Surabaya angkatan 2024: produk dan model AI.', 'Nazril, Data Science, Universitas Negeri Surabaya class of 2024: product and AI models.')}</li>
          <li>{L('Nadia, Sains Data, Universitas Negeri Surabaya angkatan 2023: data dan kebudayaan.', 'Nadia, Data Science, Universitas Negeri Surabaya class of 2023: data and culture.')}</li>
          <li>{L('Angel, Sistem Informasi angkatan 2023: ekonomi, kemitraan, dan web.', 'Angel, Information Systems class of 2023: economics, partnerships, and web.')}</li>
        </ul>
        <p>{L('SINGKAP dikembangkan untuk Kompetisi Inovasi Budaya Indonesia BUDAYA GO! kategori Inovasi Digital.', 'SINGKAP was developed for the BUDAYA GO! Indonesian Culture Innovation Competition, Digital Innovation category.')}</p>

        <h2>{L('Prinsip yang kami pegang', 'Principles we hold')}</h2>
        <ul>
          <li>
            <strong>{L('Tidak semua warisan untuk ditonton.', 'Not every heritage is a show.')}</strong>{' '}
            {L('Ritus dan upacara ditahan dari rekomendasi wisata sampai komunitas atau pemerintah daerah setuju.', 'Rites and ceremonies are held back from travel suggestions until the community or local government agrees.')}
          </li>
          <li>
            <strong>{L('Tidak menciptakan keramaian baru.', 'No new crowds.')}</strong>{' '}
            {L('Rekomendasi diberi penalti bila menumpuk di satu provinsi, dan parameternya dipilih agar ketimpangan tidak naik.', 'Suggestions are penalised when they pile up in one province, and parameters are chosen so inequality does not rise.')}
          </li>
          <li>
            <strong>{L('AI sebagai alat bantu.', 'AI as a helper.')}</strong>{' '}
            {L('Asisten tidak mengarang cerita budaya. Setiap jawaban faktual menyebut sumber, dan kalau sumbernya tidak ada, ia bilang belum tahu.', 'The assistant does not invent cultural stories. Every factual answer cites a source, and when there is none, it says it does not know yet.')}
          </li>
          <li>
            <strong>{L('Privasi.', 'Privacy.')}</strong>{' '}
            {L('Foto di Kenali Rumah Adat diproses di perangkatmu. Percakapan tidak kami simpan.', 'Photos in house recognition are processed on your device. We do not store conversations.')}
          </li>
          <li>
            <strong>{L('Hormati lisensi.', 'Respect licences.')}</strong> {L('Setiap teks dan gambar mencantumkan sumber dan lisensinya.', 'Every text and image credits its source and licence.')}
          </li>
        </ul>

        <h2 id="koreksi">{L('Koreksi dari komunitas', 'Corrections from communities')}</h2>
        <p>
          {L(
            'Pegiat budaya, komunitas pemilik, dan pemerintah daerah bisa meminta koreksi, menambah konteks, atau meminta sebuah warisan tidak ditampilkan. Sertakan nama warisan, nomor registrasi, dan penjelasan singkat.',
            'Cultural practitioners, owning communities, and local governments can request corrections, add context, or ask for an item to be hidden. Include the item name, registration number, and a short explanation.',
          )}
        </p>
        {kontak ? (
          <p>
            <a className="tombol tombol-gelap" href={`mailto:${kontak}?subject=${encodeURIComponent('Koreksi data SINGKAP')}`}>
              {L('Kirim koreksi lewat email', 'Send a correction by email')}
            </a>
          </p>
        ) : (
          <p className="catatan">{L('Alamat email tim akan dicantumkan di sini.', 'The team email address will be listed here.')}</p>
        )}

        <h2>{L('Lisensi dan atribusi', 'Licences and credits')}</h2>
        <ul>
          <li>{L('Teks turunan Wikipedia: CC BY-SA 4.0, dengan tautan ke artikel aslinya.', 'Text derived from Wikipedia: CC BY-SA 4.0, linked to the original articles.')}</li>
          <li>{L('Data Wikidata: CC0.', 'Wikidata: CC0.')}</li>
          <li>{L('Titik museum dan situs: © kontributor OpenStreetMap, lisensi ODbL.', 'Museum and site points: © OpenStreetMap contributors, ODbL.')}</li>
          <li>{L('Batas provinsi: geoBoundaries, CC BY 4.0.', 'Province boundaries: geoBoundaries, CC BY 4.0.')}</li>
          <li>
            {L('Foto pelatihan model rumah adat: Wikimedia Commons, lisensi per berkas.', 'Training photos for the house model: Wikimedia Commons, per-file licences.')}{' '}
            <a href="/data/atribusi_gambar.csv">{L('Daftar atribusi lengkap', 'Full credits list')}</a>.
          </li>
          <li>{L('Arus wisata: Badan Pusat Statistik, diolah Kementerian Pariwisata.', 'Tourist flow: Statistics Indonesia, processed by the Ministry of Tourism.')}</li>
        </ul>
        <p>
          <Link href="/metodologi">{L('Baca metodologi lengkap', 'Read the full methodology')}</Link>
        </p>
      </div>
    </>
  );
}
