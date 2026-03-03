'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bot, User, Sparkles, Anchor } from 'lucide-react';

const personalities = [
  {
    id: 'mark',
    name: 'Mark',
    emoji: '⚓',
    role: 'Owner & Operator',
    color: 'bg-mariners-teal',
    textColor: 'text-white',
    isAI: true,
    isOwner: true,
    description: 'Built this place, runs this place, lives and breathes Mariners baseball',
    details:
      'Mark owns and operates TridentFans because he believes Mariners fans deserve a real home on the internet. Die-hard fan since the 95 Refuse to Lose run. He creates the content, runs the predictions, moderates the forum, and treats every member like a valued customer.',
    topics: ['Everything Mariners', 'Site Questions', 'Trade Talk', 'Game Analysis', 'Community'],
    greeting: "Welcome to TridentFans. What's on your mind?",
  },
  {
    id: 'captain_hammy',
    name: 'Captain Hammy',
    emoji: '🧢',
    role: 'Founding Member',
    color: 'bg-mariners-navy',
    textColor: 'text-white',
    isAI: false,
    isOwner: false,
    description: 'Trade analyst, big-picture thinker, and lifelong Mariners fan',
    details:
      "Been a Mariners fan since the early 90s, grew up in Northern Idaho watching Griffey swing for the fences. Loves talking trades, team strategy, and the shared joy (and heartbreak) of being a Mariners fan.",
    topics: ['Trade Analysis', 'Team Strategy', 'Fan Perspective', 'Recent History'],
    greeting: "Let's talk Mariners!",
  },
  {
    id: 'spartan',
    name: 'Spartan',
    emoji: '⚔️',
    role: 'Resident Debater',
    color: 'bg-gray-700',
    textColor: 'text-white',
    isAI: false,
    isOwner: false,
    description: 'Stats guru, hot take artist, and devil\'s advocate',
    details:
      "Lawyer by trade, debater by passion. Steve loves a good baseball argument — whether it's trades, player comparisons, or hot takes. He'll make you work for it if you want to change his mind.",
    topics: ['Analytics', 'Debates', 'Hot Takes', 'Contract Analysis'],
    greeting: "Got a take? Let's hear it.",
  },
];

export default function BotsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <MessageCircle className="h-8 w-8 text-mariners-teal" />
          Talk to the Team
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
          Chat with Mark (the owner), get trade analysis from Captain Hammy, or debate hot takes with Spartan.
        </p>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Anchor className="h-4 w-4 text-mariners-teal" />
          <span>Site Owner - Available 24/7</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4 text-mariners-navy" />
          <span>Team Member</span>
        </div>
      </div>

      {/* Personality Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {personalities.map(person => (
          <Card
            key={person.id}
            className={`overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${person.isOwner ? 'ring-2 ring-mariners-teal' : ''}`}
          >
            {/* Header with gradient */}
            <div className={`${person.color} p-6 ${person.textColor}`}>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl">
                  {person.emoji}
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {person.name}
                    {person.isOwner ? (
                      <Anchor className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white"
                  >
                    {person.role}
                  </Badge>
                </div>
              </div>
              <p className="mt-4 text-sm opacity-90">{person.description}</p>
            </div>

            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">{person.details}</p>

              {/* Topics */}
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">TOPICS</p>
                <div className="flex flex-wrap gap-1">
                  {person.topics.map(topic => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Greeting */}
              <div className="p-3 rounded-lg bg-muted text-sm mb-4">
                <span className="font-medium">{person.emoji}</span>{' '}
                <span className="italic">&ldquo;{person.greeting}&rdquo;</span>
              </div>

              <Link href={`/chat/${person.id}`}>
                <Button variant="mariners" className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {person.isOwner ? 'Talk to Mark' : 'Start Chatting'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <div className="text-center p-6">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-mariners-teal/10 text-mariners-teal mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Owner-Operated</h3>
          <p className="text-sm text-muted-foreground">
            Mark runs TridentFans like a small business. Every question gets a real answer. Every member matters.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-mariners-navy/10 text-mariners-navy mb-4">
            <User className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Real Fan Connection</h3>
          <p className="text-sm text-muted-foreground">
            Captain Hammy and Spartan are real fans who love connecting with the community.
          </p>
        </div>
        <div className="text-center p-6">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-purple-500/10 text-purple-500 mb-4">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Always Open</h3>
          <p className="text-sm text-muted-foreground">
            Mark never sleeps. The site is always staffed and the conversation never stops.
          </p>
        </div>
      </div>
    </div>
  );
}
