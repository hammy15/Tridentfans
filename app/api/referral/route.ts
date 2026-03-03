import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate a referral code for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Check if user already has a referral code
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Get referral count
      const { count } = await supabase
        .from('referral_codes')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', userId);

      return NextResponse.json({
        code: existing.code,
        referralCount: count || 0,
        link: `https://tridentfans.com/join?ref=${existing.code}`,
      });
    }

    // Generate new code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const { error } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code });

    if (error) {
      console.error('Referral code creation error:', error);
      return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
    }

    return NextResponse.json({
      code,
      referralCount: 0,
      link: `https://tridentfans.com/join?ref=${code}`,
    });
  } catch (error) {
    console.error('Referral GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Track a referral when someone signs up
export async function POST(request: NextRequest) {
  try {
    const { code, newUserId } = await request.json();

    if (!code || !newUserId) {
      return NextResponse.json({ error: 'code and newUserId required' }, { status: 400 });
    }

    // Find the referral code
    const { data: referral } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', code)
      .single();

    if (!referral) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Don't let people refer themselves
    if (referral.user_id === newUserId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Track the referral
    await supabase
      .from('referral_codes')
      .insert({
        user_id: newUserId,
        code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        referred_by: referral.user_id,
      });

    // Check if referrer has earned the recruiter badge (3+ referrals)
    const { count } = await supabase
      .from('referral_codes')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', referral.user_id);

    if (count && count >= 3) {
      // Award recruiter badge
      // Find the recruiter badge
      const { data: recruiterBadge } = await supabase
        .from('badges')
        .select('id')
        .eq('name', 'Recruiter')
        .single();

      if (recruiterBadge) {
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', referral.user_id)
          .eq('badge_id', recruiterBadge.id)
          .single();

        if (!existingBadge) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: referral.user_id,
              badge_id: recruiterBadge.id,
            });
        }
      }
    }

    return NextResponse.json({ success: true, referrer: referral.user_id });
  } catch (error) {
    console.error('Referral POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
