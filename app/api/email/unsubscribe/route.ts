import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateUnsubscribeToken } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Handle unsubscribe with token
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const action = searchParams.get('action'); // 'info' to just get status

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    // Find user by unsubscribe token
    const { data: prefs, error } = await supabase
      .from('email_preferences')
      .select('*, profile:profiles(username, display_name)')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !prefs) {
      return NextResponse.json(
        { error: 'Invalid or expired unsubscribe token' },
        { status: 400 }
      );
    }

    // If just requesting info, return current status
    if (action === 'info') {
      return NextResponse.json({
        user_id: prefs.user_id,
        username: (prefs.profile as { username: string } | null)?.username,
        weekly_digest: prefs.weekly_digest,
        digest_day: prefs.digest_day,
      });
    }

    // Unsubscribe the user
    const { error: updateError } = await supabase
      .from('email_preferences')
      .update({
        weekly_digest: false,
        unsubscribe_token: generateUnsubscribeToken(), // Generate new token for security
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', prefs.user_id);

    if (updateError) {
      console.error('[Unsubscribe] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // Log the unsubscribe
    await supabase.from('digest_logs').insert({
      user_id: prefs.user_id,
      email_type: 'weekly_digest',
      sent_at: new Date().toISOString(),
      metadata: { action: 'unsubscribed' },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from weekly digest',
      user_id: prefs.user_id,
    });
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Resubscribe or update preferences via token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, action, digest_day } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find user by token
    const { data: prefs, error } = await supabase
      .from('email_preferences')
      .select('user_id')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !prefs) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'resubscribe': {
        // Re-enable weekly digest
        const { error: updateError } = await supabase
          .from('email_preferences')
          .update({
            weekly_digest: true,
            unsubscribe_token: generateUnsubscribeToken(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', prefs.user_id);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to resubscribe' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Successfully resubscribed to weekly digest',
        });
      }

      case 'change_day': {
        // Change digest day
        if (!digest_day || !['monday', 'friday', 'sunday'].includes(digest_day)) {
          return NextResponse.json(
            { error: 'digest_day must be monday, friday, or sunday' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('email_preferences')
          .update({
            digest_day,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', prefs.user_id);

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Digest day changed to ${digest_day}`,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use resubscribe or change_day' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Unsubscribe] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
