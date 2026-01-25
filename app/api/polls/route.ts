import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - List polls with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Single poll fetch
    if (id) {
      const { data: poll, error } = await supabase
        .from('polls')
        .select('*, options:poll_options(*)')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      // Calculate percentages
      const totalVotes = poll.options.reduce((sum: number, opt: { vote_count: number }) => sum + opt.vote_count, 0);
      poll.total_votes = totalVotes;
      poll.options = poll.options.map((opt: { vote_count: number }) => ({
        ...opt,
        percentage: totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0,
      }));

      return NextResponse.json({ poll });
    }

    // Build query
    let query = supabase
      .from('polls')
      .select('*, options:poll_options(*)')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by active status
    if (active === 'true') {
      query = query
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString());
    } else if (active === 'false') {
      query = query.or(`is_active.eq.false,ends_at.lte.${new Date().toISOString()}`);
    }

    // Filter by featured
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Pagination
    query = query.range(page * limit, (page + 1) * limit - 1);

    const { data: polls, error } = await query;

    if (error) {
      console.error('Polls fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }

    // Calculate totals and percentages
    const pollsWithTotals = (polls || []).map((poll) => {
      const totalVotes = poll.options.reduce((sum: number, opt: { vote_count: number }) => sum + opt.vote_count, 0);
      return {
        ...poll,
        total_votes: totalVotes,
        options: poll.options.map((opt: { vote_count: number }) => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0,
        })),
      };
    });

    return NextResponse.json({ polls: pollsWithTotals });
  } catch (error) {
    console.error('Polls GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

// POST - Create a new poll (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, options, category, ends_at, is_featured, allow_comments, created_by, adminPassword } = body;

    // Simple admin check
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!question || !options || options.length < 2 || !category || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (options.length > 6) {
      return NextResponse.json({ error: 'Maximum 6 options allowed' }, { status: 400 });
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        question,
        category,
        ends_at,
        is_featured: is_featured || false,
        allow_comments: allow_comments !== false,
        created_by: created_by || 'admin',
        is_active: true,
      })
      .select()
      .single();

    if (pollError) {
      console.error('Poll creation error:', pollError);
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
    }

    // Create options
    const optionInserts = options.map((text: string) => ({
      poll_id: poll.id,
      text,
      vote_count: 0,
    }));

    const { data: createdOptions, error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionInserts)
      .select();

    if (optionsError) {
      console.error('Options creation error:', optionsError);
      // Rollback poll
      await supabase.from('polls').delete().eq('id', poll.id);
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 });
    }

    return NextResponse.json({
      poll: {
        ...poll,
        options: createdOptions,
        total_votes: 0,
      },
      created: true,
    });
  } catch (error) {
    console.error('Polls POST error:', error);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}

// PUT - Update a poll (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active, is_featured, ends_at, adminPassword } = body;

    // Simple admin check
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Poll ID required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (typeof is_featured === 'boolean') updates.is_featured = is_featured;
    if (ends_at) updates.ends_at = ends_at;

    const { data: poll, error } = await supabase
      .from('polls')
      .update(updates)
      .eq('id', id)
      .select('*, options:poll_options(*)')
      .single();

    if (error) {
      console.error('Poll update error:', error);
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 });
    }

    return NextResponse.json({ poll, updated: true });
  } catch (error) {
    console.error('Polls PUT error:', error);
    return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 });
  }
}

// DELETE - Remove a poll (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminPassword = searchParams.get('adminPassword');

    // Simple admin check
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Poll ID required' }, { status: 400 });
    }

    // Delete votes first (cascade)
    await supabase.from('poll_votes').delete().eq('poll_id', id);

    // Delete options (cascade)
    await supabase.from('poll_options').delete().eq('poll_id', id);

    // Delete poll
    const { error } = await supabase.from('polls').delete().eq('id', id);

    if (error) {
      console.error('Poll delete error:', error);
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Polls DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
  }
}
