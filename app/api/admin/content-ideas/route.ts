import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get content ideas
export async function GET(request: NextRequest) {
  try {
    const { data: ideas, error } = await supabase
      .from('content_ideas')
      .select('*')
      .order('frequency', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ideas: ideas || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch content ideas' }, { status: 500 });
  }
}

// Update content idea status
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, used_for, password } = await request.json();

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== 'mariners2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const updateData: any = { status };
    if (used_for) {
      updateData.used_for = used_for;
    }

    const { data, error } = await supabase
      .from('content_ideas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, idea: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update content idea' }, { status: 500 });
  }
}