import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'TridentFans - Seattle Mariners Fan Community',
  description:
    'The ultimate Seattle Mariners fan community. AI-powered bots, predictions, forums, and real-time data for true Mariners fans.',
  keywords: ['Seattle Mariners', 'MLB', 'baseball', 'fan community', 'predictions', 'forum'],
  authors: [{ name: 'TridentFans' }],
  openGraph: {
    title: 'TridentFans - Seattle Mariners Fan Community',
    description:
      'The ultimate Seattle Mariners fan community with AI bots, predictions, and forums.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TridentFans',
    description: 'Seattle Mariners Fan Community',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
