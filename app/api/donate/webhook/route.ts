import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Lazy initialize Stripe to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
  });
}

// Badge definitions for donation tiers
const DONATION_BADGES: Record<
  string,
  { type: string; name: string; description: string; icon: string }
> = {
  bronze_slugger: {
    type: 'bronze_slugger',
    name: 'Bronze Slugger',
    description: 'Supported TridentFans with a donation',
    icon: '🥉',
  },
  silver_slugger: {
    type: 'silver_slugger',
    name: 'Silver Slugger',
    description: 'Generous supporter of TridentFans',
    icon: '🥈',
  },
  gold_slugger: {
    type: 'gold_slugger',
    name: 'Gold Slugger',
    description: 'Champion supporter of TridentFans',
    icon: '🥇',
  },
  superfan_supporter: {
    type: 'superfan_supporter',
    name: 'Superfan Supporter',
    description: 'Donated $50+ to TridentFans',
    icon: '⭐',
  },
  legend_supporter: {
    type: 'legend_supporter',
    name: 'Legend Supporter',
    description: 'Donated $100+ to TridentFans - True legend!',
    icon: '🏆',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      // In development, allow without signature
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }
    }

    let event: Stripe.Event;

    try {
      if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        event = JSON.parse(body) as Stripe.Event;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const donationId = session.metadata?.donation_id;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier;

      if (!donationId) {
        console.error('No donation_id in session metadata');
        return NextResponse.json({ error: 'Missing donation ID' }, { status: 400 });
      }

      // Update donation status
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          stripe_customer_id: session.customer as string,
        })
        .eq('id', donationId);

      if (updateError) {
        console.error('Failed to update donation:', updateError);
      }

      // Award badge if user is logged in
      if (userId && tier && tier !== 'custom') {
        const badge = DONATION_BADGES[tier];
        if (badge) {
          // Check if user already has this badge
          const { data: existingBadge } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', userId)
            .eq('badge_type', badge.type)
            .single();

          if (!existingBadge) {
            await supabase.from('user_badges').insert({
              user_id: userId,
              badge_type: badge.type,
              badge_name: badge.name,
              badge_description: badge.description,
              badge_icon: badge.icon,
            });
          }
        }
      }

      // Check for milestone badges (total donations)
      if (userId) {
        const { data: totalDonations } = await supabase
          .from('donations')
          .select('amount_cents')
          .eq('user_id', userId)
          .eq('status', 'completed');

        const totalAmount = totalDonations?.reduce((sum, d) => sum + d.amount_cents, 0) || 0;

        // Award milestone badges
        if (totalAmount >= 10000) {
          // $100+
          await awardBadgeIfNotExists(userId, 'legend_supporter');
        }
        if (totalAmount >= 5000) {
          // $50+
          await awardBadgeIfNotExists(userId, 'superfan_supporter');
        }
      }

      return NextResponse.json({ received: true, donationId });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function awardBadgeIfNotExists(userId: string, badgeType: string) {
  const badge = DONATION_BADGES[badgeType];
  if (!badge) return;

  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_type', badgeType)
    .single();

  if (!existing) {
    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_type: badge.type,
      badge_name: badge.name,
      badge_description: badge.description,
      badge_icon: badge.icon,
    });
  }
}
