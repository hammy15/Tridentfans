'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Plus,
  Trash2,
  Star,
  StarOff,
  Clock,
  Users,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { Poll, PollCategory } from '@/types';

interface PollsAdminProps {
  adminPassword: string;
}

const CATEGORIES: { value: PollCategory; label: string }[] = [
  { value: 'game', label: 'Game Day' },
  { value: 'trade', label: 'Trade Talk' },
  { value: 'roster', label: 'Roster' },
  { value: 'general', label: 'General' },
  { value: 'fun', label: 'Fun' },
];

const CATEGORY_STYLES: Record<PollCategory, string> = {
  game: 'bg-mariners-teal/10 text-mariners-teal',
  trade: 'bg-amber-500/10 text-amber-600',
  roster: 'bg-blue-500/10 text-blue-600',
  general: 'bg-mariners-navy/10 text-mariners-navy',
  fun: 'bg-purple-500/10 text-purple-600',
};

export function PollsAdmin({ adminPassword }: PollsAdminProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [category, setCategory] = useState<PollCategory>('general');
  const [endsIn, setEndsIn] = useState('24'); // hours
  const [isFeatured, setIsFeatured] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls?limit=50');
      const data = await response.json();
      if (response.ok) {
        setPolls(data.polls || []);
      }
    } catch (err) {
      console.error('Failed to fetch polls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleCreatePoll = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    setCreating(true);

    try {
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + parseInt(endsIn));

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
          category,
          ends_at: endsAt.toISOString(),
          is_featured: isFeatured,
          allow_comments: allowComments,
          adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create poll');
      }

      setSuccess('Poll created successfully!');
      setPolls((prev) => [data.poll, ...prev]);
      resetForm();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleFeatured = async (poll: Poll) => {
    try {
      const response = await fetch('/api/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: poll.id,
          is_featured: !poll.is_featured,
          adminPassword,
        }),
      });

      if (response.ok) {
        setPolls((prev) =>
          prev.map((p) => (p.id === poll.id ? { ...p, is_featured: !p.is_featured } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const handleToggleActive = async (poll: Poll) => {
    try {
      const response = await fetch('/api/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: poll.id,
          is_active: !poll.is_active,
          adminPassword,
        }),
      });

      if (response.ok) {
        setPolls((prev) =>
          prev.map((p) => (p.id === poll.id ? { ...p, is_active: !p.is_active } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/polls?id=${pollId}&adminPassword=${adminPassword}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPolls((prev) => prev.filter((p) => p.id !== pollId));
        setSuccess('Poll deleted');
      }
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    setOptions(options.map((o, i) => (i === index ? value : o)));
  };

  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setCategory('general');
    setEndsIn('24');
    setIsFeatured(false);
    setAllowComments(true);
    setError(null);
  };

  const isEnded = (poll: Poll) => new Date(poll.ends_at) <= new Date();

  // Separate active and ended polls
  const activePolls = polls.filter((p) => p.is_active && !isEnded(p));
  const endedPolls = polls.filter((p) => !p.is_active || isEnded(p));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-mariners-teal" />
          <h2 className="text-xl font-semibold">Polls Management</h2>
        </div>
        <Button
          variant="mariners"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Poll</CardTitle>
            <CardDescription>Create a quick poll for the community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question */}
            <div>
              <label className="text-sm font-medium mb-1 block">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What do you want to ask?"
                className="w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-mariners-teal focus:border-mariners-teal"
              />
            </div>

            {/* Options */}
            <div>
              <label className="text-sm font-medium mb-1 block">Options (2-6)</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-mariners-teal focus:border-mariners-teal"
                    />
                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            {/* Category & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PollCategory)}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Duration</label>
                <select
                  value={endsIn}
                  onChange={(e) => setEndsIn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">2 days</option>
                  <option value="168">1 week</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Allow Comments</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button
                variant="mariners"
                onClick={handleCreatePoll}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Poll'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Polls List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Polls */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Active Polls ({activePolls.length})
            </h3>
            {activePolls.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No active polls
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activePolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onToggleFeatured={() => handleToggleFeatured(poll)}
                    onToggleActive={() => handleToggleActive(poll)}
                    onDelete={() => handleDeletePoll(poll.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Ended Polls */}
          {endedPolls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Ended / Inactive Polls ({endedPolls.length})
              </h3>
              <div className="space-y-3">
                {endedPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onToggleFeatured={() => handleToggleFeatured(poll)}
                    onToggleActive={() => handleToggleActive(poll)}
                    onDelete={() => handleDeletePoll(poll.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PollCardProps {
  poll: Poll;
  onToggleFeatured: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function PollCard({ poll, onToggleFeatured, onToggleActive, onDelete }: PollCardProps) {
  const isEnded = new Date(poll.ends_at) <= new Date();
  const categoryStyle = CATEGORY_STYLES[poll.category];

  // Find winning option
  const winningOption = poll.options.reduce((prev, curr) =>
    curr.vote_count > prev.vote_count ? curr : prev
  );

  return (
    <Card className={poll.is_featured ? 'ring-2 ring-yellow-400' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${categoryStyle} border-0`}>{poll.category}</Badge>
              {poll.is_featured && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {!poll.is_active && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
              {isEnded && poll.is_active && (
                <Badge variant="outline" className="text-muted-foreground">
                  Ended
                </Badge>
              )}
            </div>

            <p className="font-medium mb-2 truncate">{poll.question}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {poll.total_votes} votes
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isEnded ? 'Ended' : `Ends ${new Date(poll.ends_at).toLocaleDateString()}`}
              </span>
            </div>

            {poll.total_votes > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Leading: {winningOption.text} ({winningOption.percentage}%)
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFeatured}
              title={poll.is_featured ? 'Remove featured' : 'Mark as featured'}
            >
              {poll.is_featured ? (
                <StarOff className="h-4 w-4 text-yellow-500" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleActive}
              title={poll.is_active ? 'Deactivate' : 'Activate'}
            >
              {poll.is_active ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              title="Delete poll"
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
