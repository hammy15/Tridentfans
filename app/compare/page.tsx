import { Metadata } from 'next';
import { Suspense } from 'react';
import { PlayerComparisonPage } from './PlayerComparisonPage';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Player Comparison',
  description: 'Compare MLB player stats side by side. See how Mariners players stack up against the competition.',
  openGraph: {
    title: 'Player Comparison | TridentFans',
    description: 'Compare MLB player stats side by side. See how Mariners players stack up against the competition.',
  },
};

function CompareLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareLoading />}>
      <PlayerComparisonPage />
    </Suspense>
  );
}
