import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch categories and posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'posts';
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (type === 'categories') {
      const { data: categories, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return NextResponse.json({ categories: categories || [] });
    }

    if (type === 'posts') {
      let query = supabase
        .from('forum_posts')
        .select(
          `
          *,
          author:profiles(id, username, display_name, avatar_url),
          category:forum_categories(id, name, slug, icon)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      // Get comment counts
      const postIds = posts?.map(p => p.id) || [];
      if (postIds.length > 0) {
        const { data: counts } = await supabase
          .from('forum_comments')
          .select('post_id')
          .in('post_id', postIds);

        const countMap: Record<string, number> = {};
        counts?.forEach(c => {
          countMap[c.post_id] = (countMap[c.post_id] || 0) + 1;
        });

        posts?.forEach(p => {
          (p as Record<string, unknown>).comment_count = countMap[p.id] || 0;
        });
      }

      return NextResponse.json({ posts: posts || [] });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Forum GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch forum data' }, { status: 500 });
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, categoryId, title, content } = body;

    if (!userId || !categoryId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: userId,
        category_id: categoryId,
        title,
        content,
      })
      .select(
        `
        *,
        author:profiles(id, username, display_name, avatar_url),
        category:forum_categories(id, name, slug, icon)
      `
      )
      .single();

    if (error) throw error;
    return NextResponse.json({ post: data });
  } catch (error) {
    console.error('Forum POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
