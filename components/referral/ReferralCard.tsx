'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, CheckCircle, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { buildTwitterShareUrl, buildRedditShareUrl, openShareWindow } from '@/lib/share';

export function ReferralCard() {
  const { user } = useAuth();
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchReferralCode();
  }, [user]);

  async function fetchReferralCode() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/referral?userId=${user.id}`);
      const data = await res.json();
      if (data.link) {
        setReferralLink(data.link);
        setReferralCount(data.referralCount || 0);
      }
    } catch {
      // Silently fail
    }
    setLoading(false);
  }

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareOnTwitter = () => {
    openShareWindow(
      buildTwitterShareUrl({
        title: 'Join TridentFans',
        text: `I found this Mariners fan community and it's actually legit. Come make predictions and talk M's with us.`,
        url: referralLink,
        hashtags: ['Mariners', 'SeaUsRise'],
      })
    );
  };

  const shareOnReddit = () => {
    openShareWindow(
      buildRedditShareUrl({
        title: 'Found a solid Mariners fan community — TridentFans',
        text: `Predictions, forums, live game chat. Real fans only.`,
        url: referralLink,
      })
    );
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-mariners-teal" />
          Invite Friends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Know any M&apos;s fans? Send them your link. Get 3 friends to join and earn the Recruiter badge.
        </p>

        {referralLink ? (
          <>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={shareOnTwitter} className="flex-1">
                Share on X
              </Button>
              <Button variant="outline" size="sm" onClick={shareOnReddit} className="flex-1">
                Share on Reddit
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">
                {referralCount} friend{referralCount !== 1 ? 's' : ''} joined
              </p>
              {referralCount < 3 && (
                <p className="text-xs text-muted-foreground">
                  {3 - referralCount} more for the Recruiter badge
                </p>
              )}
              {referralCount >= 3 && (
                <p className="text-xs text-mariners-teal font-medium">
                  Recruiter badge earned!
                </p>
              )}
            </div>
          </>
        ) : (
          <Button
            variant="mariners"
            className="w-full"
            onClick={fetchReferralCode}
            disabled={loading}
          >
            <Share2 className="mr-2 h-4 w-4" />
            {loading ? 'Loading...' : 'Get Your Invite Link'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
