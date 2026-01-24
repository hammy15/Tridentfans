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

// Donation tiers
const DONATION_TIERS = {
  bronze_slugger: {
    name: 'Bronze Slugger',
    amount: 100, // $1.00 in cents
    badge: {
      type: 'bronze_slugger',
      name: 'Bronze Slugger',
      description: 'Supported TridentFans with a donation',
      icon: '🥉',
    },
  },
  silver_slugger: {
    name: 'Silver Slugger',
    amount: 500, // $5.00 in cents
    badge: {
      type: 'silver_slugger',
      name: 'Silver Slugger',
      description: 'Generous supporter of TridentFans',
      icon: '🥈',
    },
  },
  gold_slugger: {
    name: 'Gold Slugger',
    amount: 1000, // $10.00 in cents
    badge: {
      type: 'gold_slugger',
      name: 'Gold Slugger',
      description: 'Champion supporter of TridentFans',
      icon: '🥇',
    },
  },
};

// GET - Get donation tiers and stats
export async function GET() {
  try {
    // Get donation stats
    const { data: stats } = await supabase
      .from('donations')
      .select('amount_cents')
      .eq('status', 'completed');

    const totalDonations = stats?.length || 0;
    const totalAmount = stats?.reduce((sum, d) => sum + d.amount_cents, 0) || 0;

    // Get recent supporters (non-anonymous)
    const { data: recentSupporters } = await supabase
      .from('donations')
      .select('tier, amount_cents, created_at, profiles(username, display_name)')
      .eq('status', 'completed')
      .eq('is_anonymous', false)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      tiers: Object.entries(DONATION_TIERS).map(([id, tier]) => ({
        id,
        name: tier.name,
        amount: tier.amount,
        badge: tier.badge,
      })),
      stats: {
        totalDonations,
        totalAmount,
      },
      recentSupporters: recentSupporters || [],
    });
  } catch (error) {
    console.error('Donate GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch donation info' }, { status: 500 });
  }
}

// POST - Create Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, customAmount, userId, email, message, isAnonymous } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let amount: number;
    let tierName: string;

    if (tier === 'custom') {
      if (!customAmount || customAmount < 100) {
        return NextResponse.json({ error: 'Custom amount must be at least $1' }, { status: 400 });
      }
      amount = customAmount;
      tierName = 'custom';
    } else {
      const tierConfig = DONATION_TIERS[tier as keyof typeof DONATION_TIERS];
      if (!tierConfig) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }
      amount = tierConfig.amount;
      tierName = tier;
    }

    // Create donation record
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        user_id: userId || null,
        email,
        amount_cents: amount,
        tier: tierName,
        message: message || null,
        is_anonymous: isAnonymous || false,
        status: 'pending',
      })
      .select()
      .single();

    if (donationError) throw donationError;

    // Create Stripe checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name:
                tier === 'custom'
                  ? 'Custom Donation to TridentFans'
                  : `${DONATION_TIERS[tier as keyof typeof DONATION_TIERS].name} - TridentFans`,
              description: 'Support the Seattle Mariners fan community',
              images: ['https://tridentfans.com/logo.png'],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tridentfans.vercel.app'}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tridentfans.vercel.app'}/donate?canceled=true`,
      customer_email: email,
      metadata: {
        donation_id: donation.id,
        user_id: userId || '',
        tier: tierName,
      },
    });

    // Update donation with Stripe session ID
    await supabase
      .from('donations')
      .update({ stripe_payment_id: session.id })
      .eq('id', donation.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Donate POST error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
