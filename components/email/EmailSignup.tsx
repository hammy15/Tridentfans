'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function EmailSignup() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || email,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Failed to subscribe');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <Card className="border-mariners-teal/30 bg-mariners-teal/5">
        <CardContent className="p-6 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-mariners-teal mb-2" />
          <p className="font-semibold">You&apos;re in.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Weekly digest drops every Sunday. See you then.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-mariners-teal/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-5 w-5 text-mariners-teal" />
          <h3 className="font-semibold">Get Mark&apos;s Weekly Digest</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Scores, standings, prediction leaders, hot takes — one email, every Sunday.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          {!user && (
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
          )}
          <Button
            type="submit"
            variant="mariners"
            disabled={loading || (!user && !email)}
            className={user ? 'w-full' : ''}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : user ? (
              'Subscribe to Digest'
            ) : (
              'Subscribe'
            )}
          </Button>
        </form>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
}
