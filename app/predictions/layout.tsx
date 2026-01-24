import { Metadata } from 'next';

const ogImageUrl =
  'https://tridentfans.com/api/og?type=prediction&title=Mariners%20Predictions&subtitle=Make%20your%20picks%20and%20compete%20for%20the%20top%20of%20the%20leaderboard';

export const metadata: Metadata = {
  title: 'Predictions',
  description:
    "Make your Seattle Mariners game predictions and compete for the top of the leaderboard. Daily pick'em with scoring and community rankings.",
  openGraph: {
    title: 'Mariners Predictions | TridentFans',
    description:
      'Make your Seattle Mariners game predictions and compete for the top of the leaderboard.',
    type: 'website',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'TridentFans Predictions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mariners Predictions | TridentFans',
    description:
      'Make your Seattle Mariners game predictions and compete for the top of the leaderboard.',
    images: [ogImageUrl],
  },
};

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
