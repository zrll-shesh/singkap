import '@fontsource/marcellus/400.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ChatWidget from '@/components/ChatWidget';
import { I18nProvider } from '@/components/I18nProvider';
import { SpeechProvider } from '@/components/SpeechProvider';
import { getLang } from '@/lib/lang-server';

export async function generateMetadata(): Promise<Metadata> {
  const en = await getLang() === 'en';
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      default: en ? 'SINGKAP: revealing heritage that is not yet seen' : 'SINGKAP: menyingkap warisan budaya yang belum terlihat',
      template: '%s | SINGKAP',
    },
    description: en
      ? 'An open-data AI platform that measures how hidden Indonesia’s intangible cultural heritage is online and guides travellers fairly.'
      : 'Platform AI dan data terbuka yang mengukur ketakterlihatan digital Warisan Budaya Takbenda Indonesia dan mengarahkan wisatawan secara berkeadilan.',
    openGraph: { title: 'SINGKAP', locale: en ? 'en_US' : 'id_ID', type: 'website' },
  };
}

export const viewport: Viewport = { themeColor: '#1f2a55', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>
        <I18nProvider lang={lang}>
          <SpeechProvider>
            <SiteHeader />
            <main id="konten">{children}</main>
            <SiteFooter />
            <ChatWidget />
          </SpeechProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
