'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Target, Calendar } from 'lucide-react';
import Link from 'next/link';

interface PredictionMarket {
  id: string;
  question: string;
  context: string;
  options: {
    id: string;
    text: string;
    percentage: number;
    color: string;
  }[];
  category: string;
  endDate: string;
  participants: number;
  trending: boolean;
}

const springMarkets: PredictionMarket[] = [
  {
    id: 'season-wins',
    question: 'Will the 2026 Mariners win more than 87.5 games?',
    context: 'Playoff teams typically need 88+ wins in today\'s MLB',
    options: [
      { id: 'over', text: 'Over 87.5', percentage: 52, color: 'bg-green-500' },
      { id: 'under', text: 'Under 87.5', percentage: 48, color: 'bg-red-500' }
    ],
    category: 'Season Outlook',
    endDate: 'Opening Day',
    participants: 247,
    trending: true
  },
  {
    id: 'sloan-velocity',
    question: 'Will Ryan Sloan hit 100 MPH this spring training?',
    context: 'He hit 99 in his debut. The triple digits await.',
    options: [
      { id: 'yes', text: 'Yes, 100+ MPH', percentage: 67, color: 'bg-mariners-teal' },
      { id: 'no', text: 'Stays under 100', percentage: 33, color: 'bg-gray-500' }
    ],
    category: 'Spring Training',
    endDate: 'March 28',
    participants: 189,
    trending: true
  },
  {
    id: 'prospect-debut',
    question: 'Which Mariners prospect debuts first in 2026?',
    context: 'The next wave of talent is gaining ground',
    options: [
      { id: 'emerson', text: 'Colt Emerson', percentage: 41, color: 'bg-mariners-navy' },
      { id: 'montes', text: 'Lazaro Montes', percentage: 35, color: 'bg-mariners-teal' },
      { id: 'cleveland', text: 'Tyler Cleveland', percentage: 15, color: 'bg-yellow-600' },
      { id: 'other', text: 'Someone else', percentage: 9, color: 'bg-gray-500' }
    ],
    category: 'Prospects',
    endDate: 'Season End',
    participants: 156,
    trending: false
  },
  {
    id: 'opening-day-starter',
    question: 'Who starts Opening Day for the Mariners?',
    context: 'Opening Day starter gets first crack at history',
    options: [
      { id: 'gilbert', text: 'Logan Gilbert', percentage: 45, color: 'bg-mariners-navy' },
      { id: 'castillo', text: 'Luis Castillo', percentage: 30, color: 'bg-mariners-teal' },
      { id: 'kirby', text: 'George Kirby', percentage: 20, color: 'bg-yellow-600' },
      { id: 'other', text: 'Other', percentage: 5, color: 'bg-gray-500' }
    ],
    category: 'Rotation',
    endDate: 'March 25',
    participants: 203,
    trending: false
  }
];

export function SpringPredictionMarkets() {
  const [selectedMarkets, setSelectedMarkets] = useState<{[key: string]: string}>({});

  const handlePrediction = (marketId: string, optionId: string) => {
    setSelectedMarkets(prev => ({
      ...prev,
      [marketId]: optionId
    }));
    // Here you would normally send to API
    console.log(`Prediction made: ${marketId} - ${optionId}`);
  };

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Target className="h-6 w-6 text-mariners-teal" />
          Put Your Mariners Knowledge to the Test
        </CardTitle>
        <CardDescription className="text-base">
          Spring training predictions and season outlook markets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {springMarkets.map((market) => (
            <div key={market.id} className="group">
              <div className="rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${market.trending ? 'border-red-200 bg-red-50 text-red-700' : ''}`}
                  >
                    {market.trending && '🔥 '}{market.category}
                  </Badge>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{market.participants} participants</div>
                    <div>Ends {market.endDate}</div>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-mariners-navy mb-2 leading-tight">
                  {market.question}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {market.context}
                </p>
                
                <div className="space-y-3">
                  {market.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handlePrediction(market.id, option.id)}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all duration-200 hover:shadow-sm ${
                        selectedMarkets[market.id] === option.id
                          ? 'border-mariners-teal bg-mariners-teal/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{option.text}</span>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-12 rounded-full bg-gray-200 overflow-hidden`}>
                            <div 
                              className={`h-full ${option.color} transition-all duration-300`}
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold min-w-[3rem] text-right">
                            {option.percentage}%
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedMarkets[market.id] && (
                  <div className="mt-4 p-3 bg-mariners-teal/10 rounded-lg">
                    <p className="text-sm text-mariners-navy font-medium">
                      ✅ Prediction locked in! 
                      <Link href="/predictions" className="ml-2 text-mariners-teal hover:underline">
                        View all your predictions →
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/predictions">
            <Button size="lg" className="bg-mariners-navy hover:bg-mariners-navy/90">
              <Trophy className="mr-2 h-5 w-5" />
              View All Prediction Markets
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}