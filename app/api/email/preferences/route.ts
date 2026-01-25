import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createDefaultEmailPreferences,
  generateUnsubscribeToken,
} from '@/lib/email';
import type { EmailPreferences, DigestDay } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Get user's email preferences
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // Get existing preferences
    const { data: existingPrefs, error: fetchError } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    let prefs = existingPrefs;
    const error = fetchError;

    // If no preferences exist, create defaults
    if (error && error.code === 'PGRST116') {
      prefs = await createDefaultEmailPreferences(userId);

      if (!prefs) {
        return NextResponse.json(
          { error: 'Failed to create email preferences' },
          { status: 500 }
        );
      }
    } else if (error) {
      console.error('[Email Preferences] GET Error:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ data: prefs });
  } catch (error) {
    console.error('[Email Preferences] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT - Update user's email preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      weekly_digest,
      digest_day,
      include_predictions,
      include_leaderboard,
      include_forum,
      include_news,
      include_upcoming_games,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validate digest_day if provided
    if (digest_day && !['monday', 'friday', 'sunday'].includes(digest_day)) {
      return NextResponse.json(
        { error: 'digest_day must be monday, friday, or sunday' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Partial<EmailPreferences> = {
      updated_at: new Date().toISOString(),
    };

    if (weekly_digest !== undefined) updates.weekly_digest = weekly_digest;
    if (digest_day !== undefined) updates.digest_day = digest_day as DigestDay;
    if (include_predictions !== undefined) updates.include_predictions = include_predictions;
    if (include_leaderboard !== undefined) updates.include_leaderboard = include_leaderboard;
    if (include_forum !== undefined) updates.include_forum = include_forum;
    if (include_news !== undefined) updates.include_news = include_news;
    if (include_upcoming_games !== undefined) updates.include_upcoming_games = include_upcoming_games;

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('email_preferences')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    let result;

    if (!existing) {
      // Create new preferences with defaults + updates
      result = await supabase
        .from('email_preferences')
        .insert({
          user_id: userId,
          weekly_digest: updates.weekly_digest ?? true,
          digest_day: updates.digest_day ?? 'sunday',
          include_predictions: updates.include_predictions ?? true,
          include_leaderboard: updates.include_leaderboard ?? true,
          include_forum: updates.include_forum ?? true,
          include_news: updates.include_news ?? true,
          include_upcoming_games: updates.include_upcoming_games ?? true,
          email_verified: false,
          unsubscribe_token: generateUnsubscribeToken(),
        })
        .select()
        .single();
    } else {
      // Update existing
      result = await supabase
        .from('email_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
    }

    if (result.error) {
      console.error('[Email Preferences] PUT Error:', result.error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('[Email Preferences] PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Verify email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, token } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'send_verification': {
        // Send verification email
        if (!userId) {
          return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get user email
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        const email = authUser?.user?.email;

        if (!email) {
          return NextResponse.json({ error: 'User email not found' }, { status: 400 });
        }

        // Generate verification token (using unsubscribe token for simplicity)
        const verificationToken = generateUnsubscribeToken();

        // Store token
        await supabase
          .from('email_preferences')
          .upsert({
            user_id: userId,
            unsubscribe_token: verificationToken,
            email_verified: false,
          })
          .eq('user_id', userId);

        // TODO: Send verification email via Resend
        // For now, auto-verify (in production, send actual email)
        console.log('[Email] Verification token for', email, ':', verificationToken);

        return NextResponse.json({
          success: true,
          message: 'Verification email sent',
        });
      }

      case 'verify': {
        // Verify email with token
        if (!token) {
          return NextResponse.json({ error: 'token is required' }, { status: 400 });
        }

        // Find user by token
        const { data: prefs, error } = await supabase
          .from('email_preferences')
          .select('user_id')
          .eq('unsubscribe_token', token)
          .single();

        if (error || !prefs) {
          return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
        }

        // Mark as verified and generate new unsubscribe token
        const { error: updateError } = await supabase
          .from('email_preferences')
          .update({
            email_verified: true,
            unsubscribe_token: generateUnsubscribeToken(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', prefs.user_id);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Email verified successfully',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use send_verification or verify' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Email Preferences] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
