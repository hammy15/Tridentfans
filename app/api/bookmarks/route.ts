import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Get user bookmarks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data: bookmarks, error } = await supabase
      .from('news_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bookmarks: bookmarks || [] });
  } catch (error) {
    console.error('Bookmarks GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

// POST - Create bookmark
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, articleUrl, articleTitle, articleSource, articleImage, articleSummary } = body;

    if (!userId || !articleUrl || !articleTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('news_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('article_url', articleUrl)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 409 });
    }

    const { data: bookmark, error } = await supabase
      .from('news_bookmarks')
      .insert({
        user_id: userId,
        article_url: articleUrl,
        article_title: articleTitle,
        article_source: articleSource,
        article_image: articleImage,
        article_summary: articleSummary,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    console.error('Bookmarks POST error:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

// DELETE - Remove bookmark
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookmarkId } = body;

    if (!userId || !bookmarkId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('news_bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bookmarks DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
  }
}
