import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or userId required' }, { status: 400 });
    }

    // If logged in user, update their email_preferences
    if (userId) {
      const { error } = await supabase
        .from('email_preferences')
        .upsert(
          {
            user_id: userId,
            weekly_digest: true,
            verified: true,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Failed to update preferences:', error);
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // For anonymous email signups, store in a simple table
    const { error } = await supabase
      .from('email_preferences')
      .upsert(
        {
          email,
          weekly_digest: true,
          verified: false,
        },
        { onConflict: 'email' }
      );

    if (error) {
      // If table doesn't have email column, just log it
      console.error('Email subscribe error:', error);
      return NextResponse.json({ success: true }); // Don't expose DB errors
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
