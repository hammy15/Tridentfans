'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, Sparkles, Loader2, Bot, User } from 'lucide-react';

const chatConfigs = {
  moose: {
    name: 'Moose',
    emoji: '🫎',
    color: 'bg-mariners-teal',
    description: 'AI-powered Mariners expert',
    isAI: true,
    role: 'AI Assistant',
    greeting:
      "Hey there, fellow Mariners fan! 🫎 I'm Moose, your AI assistant here at TridentFans. I'm here to talk all things Seattle Mariners - from our rich history since 1977 to current roster analysis. I'm available 24/7, so fire away! What's on your mind?",
  },
  captain_hammy: {
    name: 'Captain Hammy',
    emoji: '🧢',
    color: 'bg-mariners-navy',
    description: 'Lifelong M\'s fan & trade analyst',
    isAI: false,
    role: 'Founder',
    greeting:
      "What's up! I'm Captain Hammy, the founder of TridentFans. Been a Mariners fan since the early 90s - grew up in Northern Idaho watching Ken Griffey Jr. swing for the fences. I love talking trades, team strategy, and sharing in both the joy and heartbreak of being a Mariners fan. Drop me a message!",
  },
  spartan: {
    name: 'Spartan',
    emoji: '⚔️',
    color: 'bg-mariners-silver',
    description: 'Stats guru & hot take artist',
    isAI: false,
    role: 'Co-Founder',
    greeting:
      "Hey! I'm Spartan - Steve to my friends. I help run TridentFans with Captain Hammy. Love a good baseball debate - whether it's trades, player comparisons, or hot takes. I'm a lawyer by trade so I'll make you work for it if you want to change my mind. What's your take?",
  },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const params = useParams();
  const personId = params.botId as string;
  const person = chatConfigs[personId as keyof typeof chatConfigs];

  // For non-AI users (Hammy/Spartan), this controls if AI responds on their behalf
  // In production, this would be fetched from the database
  const [botModeEnabled, setBotModeEnabled] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check bot mode status for non-AI personalities
  useEffect(() => {
    if (person && !person.isAI) {
      // Fetch bot mode status from API
      fetch(`/api/bot-mode?id=${personId}`)
        .then(res => res.json())
        .then(data => {
          if (data.botModeEnabled !== undefined) {
            setBotModeEnabled(data.botModeEnabled);
          }
        })
        .catch(() => {
          // Default to bot mode if can't fetch
          setBotModeEnabled(true);
        });
    }
  }, [person, personId]);

  useEffect(() => {
    // Add greeting message on first load
    if (person && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: person.greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [person, messages.length]);

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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    // For AI (Moose) or bot mode enabled, get AI response
    if (person.isAI || botModeEnabled) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: personId,
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error('Chat error:', error);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "Sorry, I'm having trouble connecting right now. Please try again!",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    // If bot mode is disabled for Hammy/Spartan, message is just stored (they respond manually)
  };

  if (!person) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Not found</h1>
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
            className={`flex h-14 w-14 items-center justify-center rounded-full ${person.color} text-2xl`}
          >
            {person.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {person.name}
              {person.isAI ? (
                <Bot className="h-5 w-5 text-mariners-teal" />
              ) : (
                <User className="h-5 w-5 text-mariners-navy" />
              )}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={person.isAI ? 'secondary' : 'default'} className={person.isAI ? '' : 'bg-mariners-navy'}>
                {person.role}
              </Badge>
              <span className="text-muted-foreground text-sm">{person.description}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bot Mode Notice for Hammy/Spartan */}
      {!person.isAI && botModeEnabled && (
        <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>{person.name} is currently away. AI is responding on their behalf.</span>
        </div>
      )}

      {/* Chat Container */}
      <Card className="h-[calc(100vh-350px)] min-h-[400px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {message.role === 'assistant' ? (
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${person.color} text-sm`}
                >
                  {person.emoji}
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
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${person.color} text-sm`}
              >
                {person.emoji}
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
              placeholder={`Message ${person.name}...`}
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
