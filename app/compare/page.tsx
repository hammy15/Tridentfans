import { Metadata } from 'next';
import { PlayerComparisonPage } from './PlayerComparisonPage';

export const metadata: Metadata = {
  title: 'Player Comparison',
  description: 'Compare MLB player stats side by side. See how Mariners players stack up against the competition.',
  openGraph: {
    title: 'Player Comparison | TridentFans',
    description: 'Compare MLB player stats side by side. See how Mariners players stack up against the competition.',
  },
};

export default function ComparePage() {
  return <PlayerComparisonPage />;
}
