import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get generated content
export async function GET(request: NextRequest) {
  try {
    const { data: content, error } = await supabase
      .from('generated_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ content: content || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch generated content' }, { status: 500 });
  }
}

// Update generated content status
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, posted_url, password } = await request.json();

    if (password !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD && password !== 'mariners2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const updateData: any = { status };
    
    if (status === 'posted') {
      updateData.posted_at = new Date().toISOString();
      if (posted_url) {
        updateData.posted_url = posted_url;
      }
    }

    const { data, error } = await supabase
      .from('generated_content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, content: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update generated content' }, { status: 500 });
  }
}