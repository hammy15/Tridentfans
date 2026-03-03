import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET — list moderation actions and pending reports
export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [actions, reports] = await Promise.all([
    supabase
      .from('moderation_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('reported_content')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    actions: actions.data || [],
    pendingReports: reports.data || [],
  });
}

// POST — take moderation action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action, userId, reason, contentId, contentType } = body;

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!action || !userId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log the action
    await supabase.from('moderation_actions').insert({
      user_id: userId,
      action_type: action,
      reason,
      moderator: 'mark',
      content_id: contentId || null,
      content_type: contentType || null,
    });

    // Execute the action
    switch (action) {
      case 'suspend': {
        const suspendUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await supabase
          .from('profiles')
          .update({
            is_suspended: true,
            suspended_until: suspendUntil.toISOString(),
            suspension_reason: reason,
          })
          .eq('id', userId);
        break;
      }
      case 'ban':
        await supabase
          .from('profiles')
          .update({ is_banned: true, ban_reason: reason })
          .eq('id', userId);
        break;
      case 'unban':
        await supabase
          .from('profiles')
          .update({ is_banned: false, ban_reason: null, is_suspended: false, suspended_until: null, suspension_reason: null })
          .eq('id', userId);
        break;
      case 'remove_content':
        if (contentId && contentType === 'post') {
          await supabase.from('forum_posts').delete().eq('id', contentId);
        } else if (contentId && contentType === 'reply') {
          await supabase.from('forum_replies').delete().eq('id', contentId);
        }
        break;
      case 'warn':
        // Just logged, no further action needed
        break;
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json({ error: 'Failed to process moderation action' }, { status: 500 });
  }
}
