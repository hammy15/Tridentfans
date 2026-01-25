import type { Metadata, Viewport } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { PWAProvider } from '@/components/pwa/PWAProvider';
import { PostLoginInstallPrompt } from '@/components/pwa/PostLoginInstallPrompt';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { AnimatedSplash } from '@/components/onboarding/AnimatedSplash';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#005c5c' },
    { media: '(prefers-color-scheme: dark)', color: '#005c5c' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'TridentFans - Seattle Mariners Fan Community',
    template: '%s | TridentFans',
  },
  description:
    'The ultimate Seattle Mariners fan community. AI-powered bots, predictions, forums, and real-time data for true Mariners fans.',
  keywords: [
    'Seattle Mariners',
    'Mariners',
    'MLB',
    'baseball',
    'fan community',
    'predictions',
    'forum',
    'T-Mobile Park',
    'AL West',
  ],
  authors: [{ name: 'TridentFans' }],
  creator: 'Captain Hammy',
  metadataBase: new URL('https://tridentfans.com'),
  openGraph: {
    title: 'TridentFans - Seattle Mariners Fan Community',
    description:
      'The ultimate Seattle Mariners fan community with AI bots, predictions, and forums.',
    type: 'website',
    locale: 'en_US',
    siteName: 'TridentFans',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TridentFans',
    description: 'Seattle Mariners Fan Community',
    creator: '@TridentFans',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'mask-icon', url: '/icon.svg', color: '#005c5c' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TridentFans',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <PWAProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <AnimatedSplash />
              <PostLoginInstallPrompt />
            </PWAProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
