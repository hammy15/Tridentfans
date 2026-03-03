import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get Reddit opportunities
export async function GET(request: NextRequest) {
  try {
    const { data: opportunities, error } = await supabase
      .from('reddit_opportunities')
      .select('*')
      .order('relevance_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ opportunities: opportunities || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

// Update opportunity status
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, password, suggested_response } = await request.json();

    // Simple password check
    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== 'mariners2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const updateData: any = { status };
    if (suggested_response) {
      updateData.suggested_response = suggested_response;
    }

    // If marking as posted, set posted_at timestamp
    if (status === 'posted') {
      updateData.posted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('reddit_opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, opportunity: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
  }
}

// Delete old/skipped opportunities
export async function DELETE(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== 'mariners2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Delete skipped opportunities older than 7 days
    const { data, error } = await supabase
      .from('reddit_opportunities')
      .delete()
      .eq('status', 'skipped')
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      deleted: data?.length || 0,
      message: 'Cleaned up old opportunities'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cleanup opportunities' }, { status: 500 });
  }
}