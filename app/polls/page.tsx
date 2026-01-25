import { Metadata } from 'next';
import { Suspense } from 'react';
import { PollsPageClient } from './PollsPageClient';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Quick Polls',
  description: 'Vote on Mariners-related polls and see what the community thinks.',
};

function PollsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
    </div>
  );
}

export default function PollsPage() {
  return (
    <Suspense fallback={<PollsLoading />}>
      <PollsPageClient />
    </Suspense>
  );
}
