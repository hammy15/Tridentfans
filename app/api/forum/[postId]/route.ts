import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch single post with comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const { data: post, error } = await supabase
      .from('forum_posts')
      .select(
        `
        *,
        author:profiles(id, username, display_name, avatar_url),
        category:forum_categories(id, name, slug, icon)
      `
      )
      .eq('id', postId)
      .single();

    if (error) throw error;

    // Get comments
    const { data: comments } = await supabase
      .from('forum_comments')
      .select(
        `
        *,
        author:profiles(id, username, display_name, avatar_url)
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      post: { ...post, comments: comments || [] },
    });
  } catch (error) {
    console.error('Forum GET post error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// POST - Add comment to post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
      })
      .select(
        `
        *,
        author:profiles(id, username, display_name, avatar_url)
      `
      )
      .single();

    if (error) throw error;
    return NextResponse.json({ comment: data });
  } catch (error) {
    console.error('Forum POST comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

// PUT - Upvote post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'upvote') {
      // Get current upvotes
      const { data: post } = await supabase
        .from('forum_posts')
        .select('upvotes')
        .eq('id', postId)
        .single();

      const { data, error } = await supabase
        .from('forum_posts')
        .update({ upvotes: (post?.upvotes || 0) + 1 })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ post: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Forum PUT error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
