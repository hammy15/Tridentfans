'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Users } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  game_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

interface LiveGameChatProps {
  gameId: string;
}

// Generate a consistent color based on username
function getUserColor(username: string): string {
  const colors = [
    'bg-mariners-teal',
    'bg-mariners-navy',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function LiveGameChat({ gameId }: LiveGameChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [watchingCount, setWatchingCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('game_chat_messages')
        .select(`
          id,
          game_id,
          user_id,
          message,
          created_at,
          profiles (
            username
          )
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        // Reverse to show oldest first, newest at bottom
        setMessages(data.reverse() as ChatMessage[]);
      }
    }

    fetchMessages();
  }, [gameId, supabase]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to realtime updates
  useEffect(() => {
    let channel: RealtimeChannel;

    async function setupSubscription() {
      channel = supabase.channel(`game_chat:${gameId}`, {
        config: {
          presence: {
            key: user?.id || 'anonymous',
          },
        },
      });

      // Subscribe to new messages
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'game_chat_messages',
            filter: `game_id=eq.${gameId}`,
          },
          async (payload) => {
            // Fetch the full message with profile data
            const { data } = await supabase
              .from('game_chat_messages')
              .select(`
                id,
                game_id,
                user_id,
                message,
                created_at,
                profiles (
                  username
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setMessages((prev) => {
                // Keep only last 100 messages
                const updated = [...prev, data as ChatMessage];
                if (updated.length > 100) {
                  return updated.slice(-100);
                }
                return updated;
              });
            }
          }
        )
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setWatchingCount(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user) {
            await channel.track({
              user_id: user.id,
              username: profile?.username || 'Anonymous',
              online_at: new Date().toISOString(),
            });
          }
        });
    }

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [gameId, user, profile, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('game_chat_messages').insert({
      game_id: gameId,
      user_id: user.id,
      message: messageText,
    });

    if (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageText); // Restore message on error
    }

    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">Live Game Chat</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{watchingCount} watching</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => {
            const username = msg.profiles?.username || 'Anonymous';
            const isCurrentUser = msg.user_id === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getUserColor(username)}`}
                >
                  {username.charAt(0).toUpperCase()}
                </div>

                {/* Message content */}
                <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium">{username}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(msg.created_at)}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isCurrentUser
                        ? 'bg-mariners-teal text-white rounded-br-none'
                        : 'bg-muted rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        {user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              maxLength={500}
              disabled={sending}
            />
            <Button
              type="submit"
              variant="mariners"
              size="icon"
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center py-2">
            <span className="text-sm text-muted-foreground">
              Sign in to chat
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
