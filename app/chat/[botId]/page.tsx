'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Send, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

const botConfigs = {
  moose: {
    name: 'Moose',
    emoji: '🫎',
    color: 'bg-mariners-teal',
    description: 'Expert fan & historian',
    greeting:
      "Hey there, fellow Mariners fan! 🫎 I'm Moose, and I'm here to talk all things Seattle Mariners. Whether you want to dive into our rich history from 1977 to now, discuss player stats, or just chat about the game - I'm your guy. What's on your mind?",
  },
  captain_hammy: {
    name: 'Captain Hammy',
    emoji: '🧢',
    color: 'bg-mariners-navy',
    description: 'Founder & strategist',
    greeting:
      "What's up! I'm Captain Hammy, the founder of TridentFans. Been a Mariners fan since the early 90s - grew up in Northern Idaho watching Ken Griffey Jr. swing for the fences. I love talking trades, team strategy, and sharing in both the joy and heartbreak of being a Mariners fan. What do you want to chat about?",
  },
  spartan: {
    name: 'Spartan',
    emoji: '⚔️',
    color: 'bg-mariners-silver',
    description: 'Debater & analyst',
    greeting:
      "Hey! I'm Spartan - Steve to my friends. Let me guess, you want to debate something? Good, because I love a good baseball argument. Whether it's about trades, player comparisons, or hot takes - bring it on. I'm a lawyer by trade, so I'll make sure we examine all the evidence. What's your take?",
  },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const params = useParams();
  const botId = params.botId as string;
  const bot = botConfigs[botId as keyof typeof botConfigs];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add greeting message on first load
    if (bot && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: bot.greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [bot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate bot response (in production, this would call the API)
    setTimeout(() => {
      const responses = {
        moose: [
          'Great question! Did you know that the Mariners hold the MLB record for most wins in a regular season with 116 in 2001? That team was absolutely incredible - Ichiro, Edgar, Bret Boone, and so many others.',
          "That's a fascinating topic. Let me share what I know about the Mariners' history here...",
          "Fun fact: The Mariners' first ever home run was hit by Dan Meyer on April 6, 1977. We've come a long way since then!",
        ],
        captain_hammy: [
          "Here's my take on that - and I could be totally wrong - but I think the front office has been making some smart moves lately. The development of our pitching has been key.",
          'That reminds me of a trade from a few years back... the Mariners have had some really interesting deals over the years, both good and bad.',
          "As someone who's watched this team for decades, I've learned to temper my expectations. But this current core? They give me genuine hope.",
        ],
        spartan: [
          'Let me push back on that a little. While I see your point, the data actually suggests something different when you look at it from a broader perspective.',
          "Interesting take. But have you considered the counter-argument? Here's what the numbers tell us...",
          'I actually have a hot take on this one. It might not be popular, but I think the evidence supports it.',
        ],
      };

      const botResponses = responses[botId as keyof typeof responses] || [
        "That's an interesting point!",
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: randomResponse,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  if (!bot) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Bot not found</h1>
        <Link href="/">
          <Button className="mt-4">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${bot.color} text-2xl`}
          >
            {bot.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {bot.name}
              <Sparkles className="h-5 w-5 text-mariners-teal" />
            </h1>
            <p className="text-muted-foreground">{bot.description}</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="h-[calc(100vh-300px)] min-h-[400px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {message.role === 'assistant' ? (
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bot.color} text-sm`}
                >
                  {bot.emoji}
                </div>
              ) : (
                <Avatar fallback="You" className="h-8 w-8" />
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' ? 'bg-mariners-teal text-white' : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bot.color} text-sm`}
              >
                {bot.emoji}
              </div>
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${bot.name}...`}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              variant="mariners"
              size="icon"
              className="h-[60px] w-[60px]"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
