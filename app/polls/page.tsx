import { Metadata } from 'next';
import { PollsPageClient } from './PollsPageClient';

export const metadata: Metadata = {
  title: 'Quick Polls',
  description: 'Vote on Mariners-related polls and see what the community thinks.',
};

export default function PollsPage() {
  return <PollsPageClient />;
}
