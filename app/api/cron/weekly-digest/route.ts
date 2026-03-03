import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDigest } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Weekly digest cron — sends personalized emails to subscribers
// Runs Sunday morning at 9 AM PT (UTC 16:00)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users who want weekly digests
    const { data: subscribers } = await supabase
      .from('email_preferences')
      .select('user_id')
      .eq('weekly_digest', true)
      .eq('verified', true);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No digest subscribers', sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    // Process in batches of 10 to avoid rate limits
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map((sub) => sendDigest(sub.user_id))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: subscribers.length });
  } catch (error) {
    console.error('Weekly digest cron error:', error);
    return NextResponse.json({ error: 'Failed to send digests' }, { status: 500 });
  }
}
