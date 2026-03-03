'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Clock, Trash2, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  botId: string;
  createdAt: string;
  endedAt: string | null;
  messageCount: number;
  preview: string;
}

const BOT_INFO: Record<string, { name: string; emoji: string }> = {
  mark: { name: 'Mark', emoji: '⚓' },
  captain_hammy: { name: 'Captain Hammy', emoji: '🧢' },
  spartan: { name: 'Spartan', emoji: '⚔️' },
};

interface ConversationHistoryProps {
  userId: string;
  botId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  currentConversationId?: string;
}

export function ConversationHistory({
  userId,
  botId,
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, botId]);

  async function fetchConversations() {
    try {
      let url = `/api/conversations?userId=${userId}`;
      if (botId) {
        url += `&botId=${botId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
    setLoading(false);
  }

  async function deleteConversation(conversationId: string) {
    if (!confirm('Delete this conversation?')) return;

    try {
      await fetch('/api/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, userId }),
      });
      setConversations(conversations.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Conversation History
        </h3>
        <Button variant="outline" size="sm" onClick={onNewConversation}>
          <Plus className="h-4 w-4 mr-1" />
          New Chat
        </Button>
      </div>

      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No previous conversations
        </p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {conversations.map(conv => {
            const bot = BOT_INFO[conv.botId];
            const isActive = conv.id === currentConversationId;
            return (
              <div
                key={conv.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-mariners-teal/10 border-mariners-teal'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl">{bot?.emoji || '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{bot?.name || conv.botId}</p>
                      <Badge variant="outline" className="text-xs">
                        {conv.messageCount} msgs
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.preview}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={e => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
export function ConversationSidebar({
  userId,
  botId,
  onSelectConversation,
  onNewConversation,
}: Omit<ConversationHistoryProps, 'currentConversationId'>) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId, botId]);

  async function fetchConversations() {
    try {
      let url = `/api/conversations?userId=${userId}`;
      if (botId) {
        url += `&botId=${botId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setConversations(data.conversations?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
    setLoading(false);
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (conversations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Chats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {conversations.map(conv => {
          const bot = BOT_INFO[conv.botId];
          return (
            <button
              key={conv.id}
              className="w-full text-left p-2 rounded hover:bg-muted/50 transition-colors"
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex items-center gap-2">
                <span>{bot?.emoji}</span>
                <span className="text-sm truncate flex-1">{conv.preview}</span>
              </div>
            </button>
          );
        })}
        <Button variant="ghost" size="sm" className="w-full mt-2" onClick={onNewConversation}>
          <Plus className="h-4 w-4 mr-1" />
          New Chat
        </Button>
      </CardContent>
    </Card>
  );
}
