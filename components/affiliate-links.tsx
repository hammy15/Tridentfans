'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, DollarSign, Ticket, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface AffiliateLinkProps {
  partner: 'draftkings' | 'stubhub' | 'mlbshop';
  url: string;
  className?: string;
  children?: React.ReactNode;
}

export function AffiliateLink({ partner, url, className = '', children }: AffiliateLinkProps) {
  const handleClick = async () => {
    try {
      // Track the click
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner,
          clickUrl: url,
          referrerPage: window.location.pathname,
        }),
      });

      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');

    } catch (error) {
      console.error('Error tracking affiliate click:', error);
      // Still open the link even if tracking fails
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <span onClick={handleClick} className={`cursor-pointer ${className}`}>
      {children}
    </span>
  );
}

// Pre-configured affiliate link components
export function DraftKingsPromo() {
  return (
    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">DraftKings Sportsbook</CardTitle>
          </div>
          <Badge className="bg-green-100 text-green-700">New User Bonus</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Bet on the Mariners with up to $1,000 in bonus bets for new users. 
          Get started with America&apos;s #1 sportsbook.
        </p>
        <AffiliateLink 
          partner="draftkings" 
          url="https://sportsbook.draftkings.com/r/sb/1/2e9b9a5"
        >
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <span>Claim $1,000 Bonus</span>
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </AffiliateLink>
        <p className="text-xs text-center text-gray-500 mt-2">
          Must be 21+. Gambling problem? Call 1-800-GAMBLER
        </p>
      </CardContent>
    </Card>
  );
}

export function StubHubTickets() {
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Mariners Tickets</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Find the best deals on Mariners tickets. From Opening Day to playoff pushes,
          StubHub has you covered with guaranteed authentic tickets.
        </p>
        <AffiliateLink 
          partner="stubhub" 
          url="https://www.stubhub.com/seattle-mariners-tickets/performer/4567/?gcid=chAFFILIATEaff"
        >
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <span>Shop Mariners Tickets</span>
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </AffiliateLink>
        <p className="text-xs text-center text-gray-500 mt-2">
          100% guaranteed authentic tickets • Mobile entry available
        </p>
      </CardContent>
    </Card>
  );
}

export function MLBShopGear() {
  return (
    <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-teal-600" />
          <CardTitle className="text-lg">Official Mariners Gear</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Rep the M&apos;s with official jerseys, hats, and gear from MLB Shop. 
          New designs and exclusive items for the 2026 season.
        </p>
        <AffiliateLink 
          partner="mlbshop" 
          url="https://www.mlbshop.com/seattle-mariners/t-25442398+z-9737742-3208264118?_s=ak1944mlb-pla&sku=14555443&aff_code=tridentfans"
        >
          <Button className="w-full bg-teal-600 hover:bg-teal-700">
            <span>Shop Mariners Gear</span>
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </AffiliateLink>
        <p className="text-xs text-center text-gray-500 mt-2">
          Official MLB merchandise • Free shipping on orders $50+
        </p>
      </CardContent>
    </Card>
  );
}

// Inline affiliate links for content
interface InlineAffiliateLinkProps {
  partner: 'draftkings' | 'stubhub' | 'mlbshop';
  url: string;
  text: string;
  className?: string;
}

export function InlineAffiliateLink({ partner, url, text, className = '' }: InlineAffiliateLinkProps) {
  return (
    <AffiliateLink partner={partner} url={url} className={className}>
      <span className="text-blue-600 hover:text-blue-800 underline cursor-pointer">
        {text}
      </span>
    </AffiliateLink>
  );
}

// Affiliate link dashboard component for admin
export function AffiliateDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">DraftKings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$156</div>
          <p className="text-xs text-gray-500">This month</p>
          <div className="mt-2 text-sm">
            <span className="text-green-600">52 clicks</span> • 
            <span className="text-blue-600 ml-1">8 conversions</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">StubHub</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$89</div>
          <p className="text-xs text-gray-500">This month</p>
          <div className="mt-2 text-sm">
            <span className="text-green-600">34 clicks</span> • 
            <span className="text-blue-600 ml-1">5 conversions</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">MLB Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$43</div>
          <p className="text-xs text-gray-500">This month</p>
          <div className="mt-2 text-sm">
            <span className="text-green-600">28 clicks</span> • 
            <span className="text-blue-600 ml-1">3 conversions</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}