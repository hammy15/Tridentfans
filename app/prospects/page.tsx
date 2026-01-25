import type { Metadata } from 'next';
import { ProspectTracker } from '@/components/prospects/ProspectTracker';
import { FarmSystemOverview } from '@/components/prospects/FarmSystemOverview';
import { Users, Star, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Minor League Tracker',
  description:
    'Track Seattle Mariners prospects across the farm system. View scouting grades, stats, and prospect updates.',
};

export default function ProspectsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-mariners-teal" />
          Minor League Tracker
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Explore the Mariners farm system. Track top prospects, view scouting
          grades, and stay updated on promotions, demotions, and prospect news.
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-gradient-to-br from-mariners-navy to-mariners-teal rounded-xl p-6 text-white">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8" />
            <div>
              <p className="text-3xl font-bold">Top 100</p>
              <p className="text-white/70">4 MLB Top 100 Prospects</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-3xl font-bold">#8</p>
              <p className="text-muted-foreground">System Ranking (MLB)</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-3xl font-bold">150+</p>
              <p className="text-muted-foreground">Prospects Tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tracker */}
      <ProspectTracker showFilters={true} />
    </div>
  );
}
