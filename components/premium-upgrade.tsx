'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, TrendingUp, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/user-context';
import { supabase } from '@/lib/supabase/client';

interface PremiumUpgradeProps {
  className?: string;
  size?: 'compact' | 'full';
}

export function PremiumUpgrade({ className = '', size = 'full' }: PremiumUpgradeProps) {
  const { user, userProfile } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const isPremium = userProfile?.is_premium;

  const handleUpgrade = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade to premium');
      return;
    }

    setIsLoading(true);

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
          successUrl: `${window.location.origin}/premium/success`,
          cancelUrl: `${window.location.origin}/premium/cancelled`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (error) {
      console.error('Premium upgrade error:', error);
      toast.error('Failed to start upgrade process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <Card className={`border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-teal-600" />
            <Badge variant="secondary" className="bg-teal-100 text-teal-700">
              Premium Member
            </Badge>
          </div>
          <CardTitle className="text-lg">Thanks for your support! 🔱</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            You&apos;re helping build the ultimate Mariners community. Enjoy exclusive features and early access to Mark&apos;s analysis!
          </p>
        </CardContent>
      </Card>
    );
  }

  const features = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Exclusive Predictions",
      description: "Mark's private predictions with detailed reasoning"
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: "Early Access",
      description: "Read analysis and game threads before everyone else"
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: "Premium Game Threads",
      description: "Enhanced game discussions with premium-only features"
    },
    {
      icon: <Star className="w-4 h-4" />,
      title: "Direct Access",
      description: "Ask Mark questions directly in premium-only discussions"
    }
  ];

  if (size === 'compact') {
    return (
      <Card className={`border-teal-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-teal-700">Upgrade to Premium</h3>
              <p className="text-sm text-gray-600">Exclusive features for $4.99/month</p>
            </div>
            <Button 
              onClick={handleUpgrade}
              disabled={isLoading || !user}
              className="bg-teal-600 hover:bg-teal-700"
              size="sm"
            >
              {isLoading ? 'Loading...' : 'Upgrade'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-teal-200 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-teal-700">TridentFans Premium</CardTitle>
            <CardDescription>
              Support the community and unlock exclusive features
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-teal-600">$4.99</div>
            <div className="text-sm text-gray-500">per month</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 text-teal-600">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Check className="w-4 h-4 text-green-600" />
            <span>Cancel anytime • No long-term commitment</span>
          </div>
          
          <Button 
            onClick={handleUpgrade}
            disabled={isLoading || !user}
            className="w-full bg-teal-600 hover:bg-teal-700"
            size="lg"
          >
            {isLoading ? 'Starting upgrade...' : 
             !user ? 'Sign in to upgrade' : 
             'Upgrade to Premium'}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500">
          Secure payment through Stripe • Support independent Mariners coverage
        </p>
      </CardContent>
    </Card>
  );
}

// Premium feature gate component
interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
}

export function PremiumGate({ children, fallback, feature }: PremiumGateProps) {
  const { userProfile } = useUser();
  const isPremium = userProfile?.is_premium;

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="border-dashed border-teal-300 bg-teal-50">
      <CardContent className="p-6 text-center">
        <Star className="w-8 h-8 text-teal-600 mx-auto mb-3" />
        <h3 className="font-semibold mb-2">Premium Feature</h3>
        <p className="text-sm text-gray-600 mb-4">
          {feature ? `${feature} is available for premium members.` : 
           'This feature is available for premium members.'}
        </p>
        <PremiumUpgrade size="compact" />
      </CardContent>
    </Card>
  );
}