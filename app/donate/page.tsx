'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Loader2, Trophy, Users, DollarSign, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

interface DonationTier {
  id: string;
  name: string;
  amount: number;
  badge: {
    type: string;
    name: string;
    description: string;
    icon: string;
  };
}

interface RecentSupporter {
  tier: string;
  amount_cents: number;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
}

const TIER_COLORS: Record<string, string> = {
  bronze_slugger: 'from-amber-700 to-amber-900',
  silver_slugger: 'from-gray-300 to-gray-500',
  gold_slugger: 'from-yellow-400 to-yellow-600',
};

function CanceledNotice() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');

  if (!canceled) return null;

  return (
    <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
      <p className="text-yellow-800">
        Donation was canceled. Feel free to try again when you&apos;re ready!
      </p>
    </div>
  );
}

function DonateContent() {
  const { user } = useAuth();

  const [tiers, setTiers] = useState<DonationTier[]>([]);
  const [recentSupporters, setRecentSupporters] = useState<RecentSupporter[]>([]);
  const [stats, setStats] = useState({ totalDonations: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    fetchDonationInfo();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  async function fetchDonationInfo() {
    try {
      const res = await fetch('/api/donate');
      const data = await res.json();
      setTiers(data.tiers || []);
      setRecentSupporters(data.recentSupporters || []);
      setStats(data.stats || { totalDonations: 0, totalAmount: 0 });
    } catch (error) {
      console.error('Failed to fetch donation info:', error);
    }
    setLoading(false);
  }

  async function handleDonate() {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    if (!selectedTier) {
      alert('Please select a donation tier');
      return;
    }

    if (selectedTier === 'custom' && (!customAmount || parseFloat(customAmount) < 1)) {
      alert('Please enter a custom amount of at least $1');
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          customAmount:
            selectedTier === 'custom' ? Math.round(parseFloat(customAmount) * 100) : undefined,
          userId: user?.id,
          email,
          message,
          isAnonymous,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert('Failed to process donation. Please try again.');
    }

    setProcessing(false);
  }

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">Support TridentFans</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Help us keep the Mariners community thriving. Your donation supports server costs, new
          features, and keeping TridentFans free for all fans.
        </p>
      </div>

      {/* Canceled notice */}
      <Suspense fallback={null}>
        <CanceledNotice />
      </Suspense>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-12">
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{formatAmount(stats.totalAmount)}</p>
            <p className="text-muted-foreground">Total Raised</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{stats.totalDonations}</p>
            <p className="text-muted-foreground">Supporters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">3</p>
            <p className="text-muted-foreground">Badge Tiers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Donation Tiers */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Choose Your Tier</h2>

          <div className="space-y-4">
            {tiers.map(tier => (
              <Card
                key={tier.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedTier === tier.id ? 'ring-2 ring-mariners-teal' : ''
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${TIER_COLORS[tier.id]} text-white text-3xl`}
                    >
                      {tier.badge.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">{tier.name}</h3>
                        <p className="text-2xl font-bold text-mariners-teal">
                          {formatAmount(tier.amount)}
                        </p>
                      </div>
                      <p className="text-muted-foreground">{tier.badge.description}</p>
                      <Badge variant="outline" className="mt-2">
                        Earn {tier.badge.icon} {tier.badge.name} badge
                      </Badge>
                    </div>
                    {selectedTier === tier.id && (
                      <CheckCircle className="h-6 w-6 text-mariners-teal" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Custom Amount */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedTier === 'custom' ? 'ring-2 ring-mariners-teal' : ''
              }`}
              onClick={() => setSelectedTier('custom')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mariners-navy to-mariners-teal text-white text-3xl">
                    💝
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Custom Amount</h3>
                    <p className="text-muted-foreground">Choose your own amount to donate</p>
                    {selectedTier === 'custom' && (
                      <div className="mt-3">
                        <Label htmlFor="customAmount">Amount (USD)</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="customAmount"
                            type="number"
                            min="1"
                            step="1"
                            value={customAmount}
                            onChange={e => setCustomAmount(e.target.value)}
                            placeholder="10.00"
                            className="pl-8"
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedTier === 'custom' && (
                    <CheckCircle className="h-6 w-6 text-mariners-teal" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Donation Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Donation</CardTitle>
              <CardDescription>Secure payment powered by Stripe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                <p className="text-xs text-muted-foreground">Receipt will be sent to this email</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Leave a message for the community..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={checked => setIsAnonymous(checked as boolean)}
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Make my donation anonymous
                </Label>
              </div>

              <Button
                variant="mariners"
                className="w-full"
                size="lg"
                onClick={handleDonate}
                disabled={!selectedTier || !email || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Donate{' '}
                    {selectedTier === 'custom' && customAmount
                      ? `$${customAmount}`
                      : selectedTier
                        ? formatAmount(tiers.find(t => t.id === selectedTier)?.amount || 0)
                        : ''}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Payments are processed securely by Stripe. TridentFans never sees your card details.
              </p>
            </CardContent>
          </Card>

          {/* Recent Supporters */}
          {recentSupporters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Supporters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSupporters.slice(0, 5).map((supporter, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {supporter.tier === 'gold_slugger'
                            ? '🥇'
                            : supporter.tier === 'silver_slugger'
                              ? '🥈'
                              : supporter.tier === 'bronze_slugger'
                                ? '🥉'
                                : '💝'}
                        </span>
                        <span className="font-medium">
                          {supporter.profiles?.display_name ||
                            supporter.profiles?.username ||
                            'Anonymous'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatAmount(supporter.amount_cents)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Why Donate */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Why Support TridentFans?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mariners-teal/10 mx-auto mb-4">
              <span className="text-2xl">🖥️</span>
            </div>
            <h3 className="font-semibold mb-2">Server Costs</h3>
            <p className="text-sm text-muted-foreground">
              Keep the site fast and reliable for all Mariners fans
            </p>
          </div>
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mariners-teal/10 mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="font-semibold mb-2">New Features</h3>
            <p className="text-sm text-muted-foreground">
              Fund development of new tools and community features
            </p>
          </div>
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mariners-teal/10 mx-auto mb-4">
              <span className="text-2xl">🆓</span>
            </div>
            <h3 className="font-semibold mb-2">Keep It Free</h3>
            <p className="text-sm text-muted-foreground">
              Help TridentFans remain free and ad-free for everyone
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DonatePage() {
  return <DonateContent />;
}
