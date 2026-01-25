import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('featured_comparisons')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching featured comparisons:', error);
      return NextResponse.json({ comparisons: [] });
    }

    return NextResponse.json({ comparisons: data || [] });
  } catch (error) {
    console.error('Featured comparisons API error:', error);
    return NextResponse.json({ comparisons: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { player1_id, player1_name, player2_id, player2_name, label } = body;

    if (!player1_id || !player1_name || !player2_id || !player2_name || !label) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max sort order
    const { data: existing } = await supabase
      .from('featured_comparisons')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const sortOrder = existing?.[0]?.sort_order ? existing[0].sort_order + 1 : 0;

    const { data, error } = await supabase
      .from('featured_comparisons')
      .insert({
        player1_id,
        player1_name,
        player2_id,
        player2_name,
        label,
        is_active: true,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating featured comparison:', error);
      return NextResponse.json({ error: 'Failed to create comparison' }, { status: 500 });
    }

    return NextResponse.json({ comparison: data });
  } catch (error) {
    console.error('Featured comparisons POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing comparison ID' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (typeof sort_order === 'number') updates.sort_order = sort_order;

    const { data, error } = await supabase
      .from('featured_comparisons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating featured comparison:', error);
      return NextResponse.json({ error: 'Failed to update comparison' }, { status: 500 });
    }

    return NextResponse.json({ comparison: data });
  } catch (error) {
    console.error('Featured comparisons PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing comparison ID' }, { status: 400 });
  }

  try {
    const { error } = await supabase.from('featured_comparisons').delete().eq('id', id);

    if (error) {
      console.error('Error deleting featured comparison:', error);
      return NextResponse.json({ error: 'Failed to delete comparison' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Featured comparisons DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
