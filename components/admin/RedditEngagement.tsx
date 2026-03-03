'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  ExternalLink,
  CheckCircle,
  X,
  Eye,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  Clock,
  ArrowUp,
} from 'lucide-react';

interface RedditOpportunity {
  id: string;
  reddit_id: string;
  type: 'post' | 'comment' | 'mention';
  subreddit: string;
  title: string;
  content: string;
  url: string;
  relevance_score: number;
  suggested_persona: 'mark' | 'hammy' | 'spartan';
  suggested_response: string;
  keywords: string[];
  status: 'pending' | 'approved' | 'posted' | 'skipped' | 'high_priority';
  created_at: string;
}

interface ContentIdea {
  id: string;
  source: string;
  topic: string;
  frequency: number;
  sample_posts: Array<{ title: string; url: string }>;
  status: 'new' | 'in_progress' | 'used' | 'rejected';
  created_at: string;
}

interface GeneratedContent {
  id: string;
  type: string;
  title: string;
  content: string;
  metadata: any;
  created_by: string;
  status: 'draft' | 'approved' | 'posted' | 'rejected';
  created_at: string;
}

interface RedditEngagementProps {
  adminPassword: string;
}

export function RedditEngagement({ adminPassword }: RedditEngagementProps) {
  const [opportunities, setOpportunities] = useState<RedditOpportunity[]>([]);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'ideas' | 'generated'>('opportunities');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [oppsRes, ideasRes, contentRes] = await Promise.all([
        fetch('/api/admin/reddit-opportunities'),
        fetch('/api/admin/content-ideas'),
        fetch('/api/admin/generated-content'),
      ]);

      const opps = await oppsRes.json();
      const ideas = await ideasRes.json();
      const content = await contentRes.json();

      setOpportunities(opps.opportunities || []);
      setContentIdeas(ideas.ideas || []);
      setGeneratedContent(content.content || []);
    } catch (error) {
      console.error('Failed to fetch Reddit data:', error);
    }
    setLoading(false);
  };

  const runManualScan = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/cron/reddit-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      
      if (response.ok) {
        await fetchData(); // Refresh data after scan
      }
    } catch (error) {
      console.error('Manual scan failed:', error);
    }
    setRefreshing(false);
  };

  const updateOpportunityStatus = async (id: string, status: string, editedResponse?: string) => {
    try {
      await fetch('/api/admin/reddit-opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status, 
          password: adminPassword,
          ...(editedResponse && { suggested_response: editedResponse })
        }),
      });
      
      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === id 
            ? { ...opp, status: status as any, ...(editedResponse && { suggested_response: editedResponse }) }
            : opp
        )
      );
    } catch (error) {
      console.error('Failed to update opportunity:', error);
    }
  };

  const getPersonaEmoji = (persona: string) => {
    switch (persona) {
      case 'mark': return '⚓';
      case 'hammy': return '🧢';
      case 'spartan': return '⚔️';
      default: return '👤';
    }
  };

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case 'mark': return 'bg-mariners-teal text-white';
      case 'hammy': return 'bg-mariners-navy text-white';
      case 'spartan': return 'bg-mariners-silver text-black';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high_priority': return 'bg-red-500 text-white';
      case 'approved': return 'bg-green-500 text-white';
      case 'posted': return 'bg-blue-500 text-white';
      case 'skipped': return 'bg-gray-500 text-white';
      default: return 'bg-yellow-500 text-black';
    }
  };

  const OpportunityCard = ({ opp }: { opp: RedditOpportunity }) => {
    const [editingResponse, setEditingResponse] = useState(false);
    const [editedResponse, setEditedResponse] = useState(opp.suggested_response);

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getPersonaColor(opp.suggested_persona)}>
                  {getPersonaEmoji(opp.suggested_persona)} {opp.suggested_persona}
                </Badge>
                <Badge className={getStatusColor(opp.status)}>
                  {opp.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">
                  r/{opp.subreddit}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {opp.relevance_score}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-tight">{opp.title}</CardTitle>
              {opp.content && (
                <CardDescription className="mt-2 text-sm line-clamp-3">
                  {opp.content}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(opp.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Keywords */}
            {opp.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {opp.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested Response */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Suggested Response:</span>
                {opp.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingResponse(!editingResponse);
                      setEditedResponse(opp.suggested_response);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    {editingResponse ? 'Cancel' : 'Edit'}
                  </Button>
                )}
              </div>
              {editingResponse ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedResponse}
                    onChange={(e) => setEditedResponse(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateOpportunityStatus(opp.id, 'approved', editedResponse);
                        setEditingResponse(false);
                      }}
                    >
                      Save & Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingResponse(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{opp.suggested_response}</p>
              )}
            </div>

            {/* Actions */}
            {opp.status === 'pending' && !editingResponse && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => updateOpportunityStatus(opp.id, 'approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateOpportunityStatus(opp.id, 'skipped')}
                >
                  <X className="h-4 w-4 mr-1" />
                  Skip
                </Button>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(opp.created_at).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading Reddit engagement data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = opportunities.filter(o => o.status === 'pending').length;
  const highPriorityCount = opportunities.filter(o => o.status === 'high_priority').length;
  const approvedCount = opportunities.filter(o => o.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Reddit Engagement
              </CardTitle>
              <CardDescription>
                Monitor Reddit for organic engagement opportunities and trending content
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={runManualScan}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Scan Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contentIdeas.length}</div>
              <div className="text-sm text-muted-foreground">Content Ideas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'opportunities'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
        >
          Opportunities ({opportunities.length})
        </button>
        <button
          onClick={() => setActiveTab('ideas')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'ideas'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
        >
          Content Ideas ({contentIdeas.length})
        </button>
        <button
          onClick={() => setActiveTab('generated')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'generated'
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
        >
          Generated ({generatedContent.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'opportunities' && (
        <div>
          {/* High priority first */}
          {opportunities
            .filter(o => o.status === 'high_priority')
            .map(opp => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          
          {/* Then pending, sorted by relevance */}
          {opportunities
            .filter(o => o.status === 'pending')
            .sort((a, b) => b.relevance_score - a.relevance_score)
            .map(opp => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          
          {/* Then approved */}
          {opportunities
            .filter(o => o.status === 'approved')
            .slice(0, 5) // Limit to avoid clutter
            .map(opp => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          
          {opportunities.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
                <p className="text-muted-foreground mb-4">
                  Run a manual scan to find new engagement opportunities
                </p>
                <Button onClick={runManualScan} disabled={refreshing}>
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Scan Reddit Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'ideas' && (
        <div className="space-y-4">
          {contentIdeas.map(idea => (
            <Card key={idea.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{idea.topic}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {idea.frequency}
                    </Badge>
                    <Badge className={getStatusColor(idea.status)}>
                      {idea.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Source: {idea.source} • {new Date(idea.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              {idea.sample_posts.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sample posts:</p>
                    {idea.sample_posts.slice(0, 3).map((post, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        • {post.title}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
          
          {contentIdeas.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No trending topics found</h3>
                <p className="text-muted-foreground">
                  Content ideas will appear here when Reddit monitoring detects trending Mariners topics
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'generated' && (
        <div className="space-y-4">
          {generatedContent.map(content => (
            <Card key={content.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{content.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getPersonaColor(content.created_by)}>
                      {getPersonaEmoji(content.created_by)} {content.created_by}
                    </Badge>
                    <Badge className={getStatusColor(content.status)}>
                      {content.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {content.type} • {new Date(content.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{content.content}</p>
                </div>
                {content.metadata?.forum_topic && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                    <p className="text-sm text-blue-700">
                      <strong>Forum topic idea:</strong> {content.metadata.forum_topic}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {generatedContent.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No generated content</h3>
                <p className="text-muted-foreground">
                  AI-generated content based on trending topics will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}