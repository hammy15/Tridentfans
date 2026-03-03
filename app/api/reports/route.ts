import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST — submit a report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reporterId, contentType, contentId, reason } = body;

    if (!contentType || !contentId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.from('reported_content').insert({
      reporter_id: reporterId || null,
      content_type: contentType,
      content_id: contentId,
      reason,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Report submitted. Mark will review it.' });
  } catch (error) {
    console.error('Report submission error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
