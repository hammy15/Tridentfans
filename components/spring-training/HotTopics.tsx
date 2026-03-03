'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, MessageCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HotTopic {
  id: string;
  title: string;
  description: string;
  predictions: string;
  category: string;
  engagement: string;
  trending: boolean;
}

const springTrainingTopics: HotTopic[] = [
  {
    id: 'sloan-phenomenon',
    title: 'The Sloan Phenomenon',
    description: '99 MPH in his debut. Is Ryan Sloan the rotation answer we\'ve been waiting for? After his electric Cactus League debut that had everyone saying "Nasty, bro!" we need to separate velocity hype from rotation reality.',
    predictions: '73% say he makes Opening Day roster',
    category: 'Spring Training',
    engagement: '127 predictions',
    trending: true
  },
  {
    id: 'montes-mania',
    title: 'Montes Mania',
    description: 'Everything about Lazaro Montes is big. But is he ready for the big leagues? The 21-year-old #43 prospect has the tools, the size, and the hype. History shows this is when Mariners prospects either break through or break our hearts.',
    predictions: '41% say he debuts in 2026',
    category: 'Prospects',
    engagement: '94 predictions',
    trending: true
  },
  {
    id: 'miller-dilemma',
    title: 'The Miller Dilemma',
    description: 'Bryce Miller\'s oblique concern has rotation depth in question. Our young ace felt great until he didn\'t. The inflammation isn\'t serious, but it\'s a reminder that pitching depth wins championships.',
    predictions: '67% say he\'s ready for Opening Day',
    category: 'Rotation',
    engagement: '156 predictions',
    trending: false
  },
  {
    id: 'championship-window',
    title: 'Championship Window',
    description: 'After 25 years of heartbreak, is 2026 finally our year? We\'ve been here before - the hype, the hope, the inevitable disappointment. But something feels different about this team. Are we really ready to compete?',
    predictions: '58% say we make playoffs',
    category: 'Season Outlook',
    engagement: '203 predictions',
    trending: true
  }
];

export function HotTopics() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-mariners-teal" />
            What Mariners Fans Are Talking About
          </CardTitle>
          <CardDescription className="text-base">
            Spring training buzz and season predictions
          </CardDescription>
        </div>
        <Link href="/forum">
          <Button variant="ghost" size="sm">
            Join Discussion
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {springTrainingTopics.map((topic) => (
            <div key={topic.id} className="group">
              <Link href={`/forum/topic/${topic.id}`} className="block">
                <div className="rounded-lg border p-6 transition-all duration-200 hover:shadow-md hover:border-mariners-teal/50 group-hover:bg-muted/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-mariners-navy group-hover:text-mariners-teal transition-colors">
                        {topic.title}
                      </h3>
                      {topic.trending && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                          🔥 Trending
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {topic.category}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {topic.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-mariners-teal font-semibold">
                        <MessageCircle className="h-4 w-4" />
                        {topic.engagement}
                      </div>
                      <div className="bg-mariners-navy/10 text-mariners-navy px-3 py-1 rounded-full font-medium">
                        {topic.predictions}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-mariners-teal transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <Link href="/forum" className="block">
            <Button variant="outline" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              View All Discussions
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}