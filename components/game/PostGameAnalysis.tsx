'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';

export function PostGameAnalysis() {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Trophy className="h-5 w-5" />
            REDEMPTION COMPLETE
          </CardTitle>
          <Badge className="bg-green-600 text-white">FINAL</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-800 mb-2">
              Mariners 5 - Rangers 1
            </div>
            <p className="text-green-700 font-semibold">
              March 6, 2026 | Perfect Bounce-Back Victory
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              The Turnaround Story
            </h3>
            <p className="text-sm text-gray-700">
              From yesterday&apos;s historic 27-6 loss to today&apos;s methodical 5-1 victory. 
              This is the resilience that defines championship teams.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-800">4-9</div>
              <div className="text-sm text-gray-600">Spring Record</div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-800">.308</div>
              <div className="text-sm text-gray-600">Win %</div>
            </div>
          </div>

          <div className="bg-mariners-teal/10 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-mariners-navy">
              🎯 Prediction Contest Winners: Check your points!
            </p>
            <p className="text-xs text-gray-600 mt-1">
              2x bonus points for Mariners win predictions
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar className="h-4 w-4" />
              Next Game: Tomorrow vs Rangers, 1:05 PM PT
            </div>
            <p className="text-xs text-gray-500">
              &quot;Yesterday was embarrassing. Today was encouraging. Tomorrow is why we keep watching.&quot;
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}